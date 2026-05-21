use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use uuid::Uuid;

use crate::models::offer::{ContractType, RemotePolicy};
use crate::models::pagination::Pagination;

use crate::AppState;
use crate::security::middleware::AuthUser;
#[derive(Deserialize)]
pub struct OfferFilters {
    pub contract_type: Option<ContractType>,
    pub remote_policy: Option<RemotePolicy>,
    pub city: Option<String>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct OfferListItem {
    pub id: Uuid,
    pub title: String,
    pub company: Option<String>,
    pub location_city: Option<String>,
    pub contract_type: ContractType,
    pub remote_policy: RemotePolicy,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct OfferDetail {
    pub id: Uuid,
    pub source: String,
    pub source_id: String,
    pub title: String,
    pub description: String,
    pub company: Option<String>,
    pub location_city: Option<String>,
    pub location_country: Option<String>,
    pub remote_policy: RemotePolicy,
    pub contract_type: ContractType,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub salary_currency: Option<String>,
    pub posted_at: Option<DateTime<Utc>>,
}

pub async fn list_offers(
    State(app_state): State<AppState>,
    _user: AuthUser,
    Query(filters): Query<OfferFilters>,
    Query(pagination): Query<Pagination>,
) -> Result<Json<Vec<OfferListItem>>, (StatusCode, String)> {
    
    let pool = app_state.db;

    let mut query: QueryBuilder<Postgres> = QueryBuilder::new(
        "SELECT id, title, company, location_city, contract_type, remote_policy FROM offers WHERE is_active = TRUE "
    );

    if let Some(contract) = filters.contract_type {
        query.push(" AND contract_type = ");
        query.push_bind(contract);
    }

    if let Some(remote) = filters.remote_policy {
        query.push(" AND remote_policy = ");
        query.push_bind(remote);
    }

    if let Some(city) = filters.city {
        query.push(" AND location_city ILIKE ");
        query.push_bind(format!("%{}%", city));
    }

    query.push(" ORDER BY posted_at DESC NULLS LAST ");

    let limit = pagination.limit.unwrap_or(20).clamp(1, 100);
    let offset = pagination.offset.unwrap_or(0);
    
    query.push(" LIMIT ").push_bind(limit);
    query.push(" OFFSET ").push_bind(offset);

    let offers = query
        .build_query_as::<OfferListItem>()
        .fetch_all(&pool)
        .await
        .map_err(|e| {
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Erreur DB: {}", e))
        })?;

    Ok(Json(offers))
}

pub async fn get_offer(
    State(app_state): State<AppState>,
    _user: AuthUser,
    Path(offer_id): Path<Uuid>,
) -> Result<Json<OfferDetail>, (StatusCode, String)> {
    let row = sqlx::query_as::<_, OfferDetail>(
        r#"
        SELECT id, source, source_id, title, description, company,
               location_city, location_country, remote_policy, contract_type,
               salary_min, salary_max, salary_currency, posted_at
        FROM offers
        WHERE id = $1 AND is_active = TRUE
        "#,
    )
    .bind(offer_id)
    .fetch_optional(&app_state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match row {
        Some(offer) => Ok(Json(offer)),
        None => Err((StatusCode::NOT_FOUND, "Offre introuvable".to_string())),
    }
}