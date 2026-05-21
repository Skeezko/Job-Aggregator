use crate::{
    AppState,
    error::AppError,
    security::{
        jwt::{ft_generate_access_token, ft_generate_refresh_token},
        password,
    },
    utils::ip::ft_get_ip,
};
use axum::{
    Json,
    extract::{ConnectInfo, State},
    http::{HeaderMap, StatusCode, header},
    response::IntoResponse,
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use chrono::Utc;
use cookie::time::Duration as CookieDuration;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{Type, types::ipnetwork::IpNetwork};
use std::net::SocketAddr;
use validator::Validate;
use zxcvbn::{Score, zxcvbn};
use crate::security::middleware::AuthUser;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterForm {
    #[validate(email)]
    #[validate(length(max = 255))]
    email: String,
    #[validate(length(min = 12, max = 128))]
    password: String,
    #[validate(length(max = 100))]
    firstname: String,
    #[validate(length(max = 100))]
    lastname: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginForm {
    #[validate(length(max = 255))]
    email: String,
    #[validate(length(min = 12, max = 128))]
    password: String,
}

#[derive(Debug, Clone, Type, PartialEq, Serialize, Deserialize)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
}

#[derive(Serialize)]
pub struct AuthResponse {
    pub access_token: String,
}

pub async fn ft_register(
    State(app): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(user_data): Json<RegisterForm>,
) -> Result<impl IntoResponse, AppError> {
    user_data
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let pwd_lower = user_data.password.to_lowercase();
    let forbidden = [
        user_data.email.to_lowercase(),
        user_data.firstname.to_lowercase(),
        user_data.lastname.to_lowercase(),
    ];

    for word in &forbidden {
        if word.len() >= 3 && pwd_lower.contains(word) {
            return Err(AppError::PasswordTooWeak(
                "Password cannot contain your name or email".into(),
            ));
        }
    }

    let lowercased_email = user_data.email.trim().to_lowercase();
    let password_strength = zxcvbn(
        &user_data.password,
        &[&user_data.email, &user_data.firstname, &user_data.lastname],
    );

    if password_strength.score() < Score::Three {
        let msg = password_strength
            .feedback()
            .and_then(|f| f.warning())
            .map(|w| w.to_string())
            .unwrap_or_else(|| "Password too weak".into());
        return Err(AppError::PasswordTooWeak(msg));
    }

    let password = user_data.password.clone();
    let pepper = app.pepper.clone();

    let hashed_password =
        tokio::task::spawn_blocking(move || password::ft_hash_password(password, pepper))
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("spawn_blocking join: {}", e)))??;

    let raw_ip = ft_get_ip(&headers, addr);

    let result = sqlx::query!(
        "INSERT INTO users (email, password_hash, firstname, lastname) VALUES ($1, $2, $3, $4)",
        lowercased_email,
        hashed_password,
        user_data.firstname,
        user_data.lastname
    )
    .execute(&app.db)
    .await;

    match result {
        Ok(_) => {}
        Err(sqlx::Error::Database(dbe)) if dbe.constraint() == Some("users_email_key") => {
            tracing::info!(ip = %raw_ip, email = %lowercased_email, "Register attempt with existing email");
        }
        Err(e) => return Err(AppError::Database(e)),
    }
    Ok((StatusCode::CREATED, "A confirmation mail has been sent"))
}

pub async fn ft_login(
    State(app): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(user_input): Json<LoginForm>,
) -> Result<impl IntoResponse, AppError> {
    user_input
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let lowercased_email = user_input.email.trim().to_lowercase();

    let find_user = sqlx::query!(
        r#"SELECT id, email, password_hash, firstname, lastname, role as "role: UserRole" FROM users WHERE email=$1"#,
        lowercased_email
    )
    .fetch_optional(&app.db)
    .await?;

    let raw_ip = ft_get_ip(&headers, addr);
    let ip = IpNetwork::from(raw_ip);

    let user = match find_user {
        Some(usr) => usr,
        None => {
            let fake_hash = "$argon2id$v=19$m=19456,t=2,p=1$ErD6AWMVHgq54K8zorcdZw$NVhFYBQbTPYbUEdhiE8+VK5rqsHFvcA6XfOZSOSjwmg".to_string().clone();
            let password = user_input.password.clone();
            let pepper = app.pepper.clone();

            tokio::task::spawn_blocking(move || {
                password::ft_check_password(fake_hash, password, pepper)
            })
            .await
            .ok();
            tracing::warn!(ip = %raw_ip, email = %lowercased_email, "User not found");
            return Err(AppError::InvalidCredentials);
        }
    };

    let hash = user.password_hash.clone();
    let password = user_input.password.clone();
    let pepper = app.pepper.clone();

    let is_valid_password =
        tokio::task::spawn_blocking(move || password::ft_check_password(hash, password, pepper))
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("spawn_blocking join: {}", e)))??;

    if !is_valid_password {
        tracing::warn!(ip = %raw_ip, user_id = %user.id, email = %lowercased_email, "Invalid password");
        return Err(AppError::InvalidCredentials);
    }

    let access_token = ft_generate_access_token(&app.jwt_secret, user.id, user.role)?;
    let refresh_tokens = ft_generate_refresh_token();
    let expires_at = Utc::now() + chrono::Duration::days(30);
    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(String::from);

    sqlx::query!("INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5)", user.id, refresh_tokens.1, user_agent, ip, expires_at)
    .execute(&app.db).await?;

    let refresh_cookie = Cookie::build(("refresh_token", refresh_tokens.0))
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Strict)
        .max_age(CookieDuration::days(30))
        .path("/")
        .build();

    let response = (
        StatusCode::OK,
        [(header::SET_COOKIE, refresh_cookie.to_string())],
        Json(AuthResponse { access_token }),
    );

    Ok(response)
}

pub async fn ft_refresh(
    State(app): State<AppState>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    jar: CookieJar,
) -> Result<impl IntoResponse, AppError> {
    let raw_ip = ft_get_ip(&headers, addr);
    let ip = IpNetwork::from(raw_ip);

    let refresh_token = match jar.get("refresh_token") {
        Some(cookie) => cookie.value().to_string(),
        None => {
            tracing::warn!(ip = %raw_ip, "Refresh attempt without cookie");
            return Err(AppError::Unauthorized);
        }
    };

    let encoded_token = hex::encode(Sha256::digest(refresh_token.as_bytes()));

    let used_token = sqlx::query!(
        "SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NOT NULL",
        encoded_token
    )
    .fetch_optional(&app.db)
    .await?;

    if let Some(reused) = used_token {
        sqlx::query!(
            "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1",
            reused.user_id
        )
        .execute(&app.db)
        .await?;
        tracing::warn!(ip = %raw_ip, user_id = %reused.user_id, "Refresh token reused, all sessions revoked");
        return Err(AppError::TokenReused);
    }

    let current_token = match sqlx::query!(r#"SELECT refresh_tokens.user_id, refresh_tokens.expires_at, users.role as "role: UserRole" FROM refresh_tokens INNER JOIN users ON refresh_tokens.user_id = users.id WHERE refresh_tokens.token_hash = $1 AND refresh_tokens.revoked_at IS NULL AND refresh_tokens.expires_at > NOW()"#, encoded_token).fetch_optional(&app.db).await? {
        Some(tkn) => tkn,
        None => {
            tracing::warn!(ip = %raw_ip, "Refresh with invalid or expired token");
            return Err(AppError::Unauthorized);
        }
    };

    sqlx::query!(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1",
        encoded_token
    )
    .execute(&app.db)
    .await?;

    let access_token =
        ft_generate_access_token(&app.jwt_secret, current_token.user_id, current_token.role)?;
    let refresh_tokens = ft_generate_refresh_token();
    let expires_at = Utc::now() + chrono::Duration::days(30);
    let user_agent = headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(String::from);

    sqlx::query!("INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5)", current_token.user_id, refresh_tokens.1, user_agent, ip, expires_at)
    .execute(&app.db).await?;

    let refresh_cookie = Cookie::build(("refresh_token", refresh_tokens.0))
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Strict)
        .max_age(CookieDuration::days(30))
        .path("/")
        .build();

    let response = (
        StatusCode::OK,
        [(header::SET_COOKIE, refresh_cookie.to_string())],
        Json(AuthResponse { access_token }),
    );

    Ok(response)
}

pub async fn ft_logout(
    State(app): State<AppState>,
    jar: CookieJar,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let raw_ip = ft_get_ip(&headers, addr);

    let refresh_token = match jar.get("refresh_token") {
        Some(cookie) => cookie.value().to_string(),
        None => {
            tracing::warn!(ip = %raw_ip, "Logout attempt without cookie");
            return Err(AppError::Unauthorized);
        }
    };

    let encoded_token = hex::encode(Sha256::digest(refresh_token.as_bytes()));

    sqlx::query!(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1",
        encoded_token
    )
    .execute(&app.db)
    .await?;

    let remove_cookie = Cookie::build(("refresh_token", ""))
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Strict)
        .max_age(CookieDuration::seconds(-1))
        .path("/")
        .build();

    let response = (
        StatusCode::OK,
        [(header::SET_COOKIE, remove_cookie.to_string())],
        "Logged out successfully",
    );

    Ok(response)
}

pub async fn ft_me(
    user: AuthUser,
) -> Result<Json<MeResponse>, StatusCode> {
    
    Ok(Json(MeResponse {
        id: user.id,
        role: format!("{:?}", user.role),
    }))
}
