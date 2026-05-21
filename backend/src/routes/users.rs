use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::AppState;
use crate::security::middleware::AuthUser;

#[derive(Deserialize)]
pub struct SaveOfferPayload {
    pub notes: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct SavedOfferResponse {
    pub offer_id: Uuid,
    pub title: String,
    pub company: Option<String>,
    pub notes: Option<String>,
    pub saved_at: chrono::DateTime<chrono::Utc>,
}

pub async fn save_offer(
    State(app_state): State<AppState>,
    user: AuthUser,
    Path(offer_id): Path<Uuid>,
    Json(payload): Json<SaveOfferPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    
    let pool = app_state.db;

    let result = sqlx::query!(
        r#"
        INSERT INTO saved_offers (user_id, offer_id, notes)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, offer_id) 
        DO UPDATE SET notes = EXCLUDED.notes, saved_at = NOW()
        "#,
        user.id,
        offer_id,
        payload.notes
    )
    .execute(&pool)
    .await;

    match result {
        Ok(_) => Ok(StatusCode::CREATED),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn get_saved_offers(
    State(app_state): State<AppState>,
    user: AuthUser,
) -> Result<Json<Vec<SavedOfferResponse>>, (StatusCode, String)> {
    
    let pool = app_state.db;

    let saved_offers = sqlx::query_as::<_, SavedOfferResponse>(
        r#"
        SELECT s.offer_id, o.title, o.company, s.notes, s.saved_at
        FROM saved_offers s
        JOIN offers o ON s.offer_id = o.id
        WHERE s.user_id = $1
        ORDER BY s.saved_at DESC
        "#
    )
    .bind(user.id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(saved_offers))
}

pub async fn remove_saved_offer(
    State(app_state): State<AppState>,
    user: AuthUser,
    Path(offer_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    
    let pool = app_state.db;

    sqlx::query!(
        "DELETE FROM saved_offers WHERE user_id = $1 AND offer_id = $2",
        user.id,
        offer_id
    )
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}