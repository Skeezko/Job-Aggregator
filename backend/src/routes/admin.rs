use axum::{
    extract::{Path, State, Extension},
    http::StatusCode,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::security::jwt::Claims;
use crate::models::user::UserRole; 

pub async fn disable_offer(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(offer_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    
    if claims.role != UserRole::Admin {
        return Err((
            StatusCode::FORBIDDEN, 
            "Accès refusé".to_string()
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