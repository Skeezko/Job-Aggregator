use crate::AppState;
use crate::error::AppError;
use crate::routes::auth::UserRole;
use crate::security::jwt::Claims;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::header::AUTHORIZATION;
use axum::http::request::Parts;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use secrecy::ExposeSecret;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub role: UserRole,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app = AppState::from_ref(state);

        if let Some(authorization_header) = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
        {
            if let Some(token) = authorization_header.strip_prefix("Bearer ") {
                let jwt = decode::<Claims>(
                    &token,
                    &DecodingKey::from_secret(app.jwt_secret.expose_secret().as_bytes()),
                    &Validation::new(Algorithm::HS256),
                )
                .map_err(|err| {
                    tracing::warn!(error = %err, "JWT validation failed");
                    AppError::Unauthorized
                })?;
                Ok(AuthUser {
                    id: jwt.claims.sub,
                    role: jwt.claims.role,
                })
            } else {
                tracing::warn!("Missing Bearer");
                Err(AppError::Unauthorized)
            }
        } else {
            tracing::warn!("Missing Authorization header");
            Err(AppError::Unauthorized)
        }
    }
}
