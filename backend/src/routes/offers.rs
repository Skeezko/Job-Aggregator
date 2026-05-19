use axum::{
    extract::{Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

use crate::models::offer::{ContractType, RemotePolicy};
use crate::models::pagination::Pagination;

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

pub async fn list_offers(
    State(pool): State<PgPool>,
    Query(filters): Query<OfferFilters>,
    Query(pagination): Query<Pagination>,
) -> Result<Json<Vec<OfferListItem>>, (StatusCode, String)> {
    
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