use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::security::jwt::Claims;
use crate::routes::auth::UserRole;

use crate::AppState;

#[derive(Serialize, sqlx::FromRow)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub firstname: String,
    pub lastname: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
}


// la passer en is_active = FALSE)
pub async fn disable_offer(
    State(app_state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(offer_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    
    let pool = app_state.db;

    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            "Accès refusé : Action réservée aux administrateurs".to_string(),
        ));
    }

    let result = sqlx::query!(
        "UPDATE offers SET is_active = FALSE WHERE id = $1",
        offer_id
    )
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Offre introuvable".to_string()));
    }

    Ok(StatusCode::OK)
}

pub async fn list_users(
    State(app_state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, String)> {
    
    let pool = app_state.db;

    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN,
            "Accès refusé : Action réservée aux administrateurs".to_string(),
        ));
    }

    let users = sqlx::query_as::<_, UserResponse>(
        r#"
        SELECT id, email, firstname, lastname, role, created_at 
        FROM users 
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(users))
}