use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::AppState;
use crate::routes::auth::UserRole;
use crate::security::middleware::AuthUser;

#[derive(Serialize, sqlx::FromRow)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub firstname: String,
    pub lastname: String,
    pub role: UserRole,
    pub created_at: DateTime<Utc>,
}

pub async fn disable_offer(
    State(app_state): State<AppState>,
    user: AuthUser,
    Path(offer_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    
    if user.role != UserRole::Admin {
        return Err((StatusCode::FORBIDDEN, "Accès réservé aux administrateurs".to_string()));
    }

    let pool = app_state.db;

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
    user: AuthUser,
) -> Result<Json<Vec<UserResponse>>, (StatusCode, String)> {
    
    if user.role != UserRole::Admin {
        return Err((StatusCode::FORBIDDEN, "Accès réservé aux administrateurs".to_string()));
    }

    let pool = app_state.db;

    let users = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, firstname, lastname, role, created_at FROM users ORDER BY created_at DESC"
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(users))
}