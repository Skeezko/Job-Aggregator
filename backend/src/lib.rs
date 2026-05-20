use axum::Router;
use axum::http::HeaderValue;
use secrecy::Secret;
use sqlx::PgPool;
use std::sync::Arc;

pub mod error;
pub mod layers;
pub mod routes;
pub mod security;
pub mod utils;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub pepper: Arc<Secret<String>>,
    pub jwt_secret: Arc<Secret<String>>,
}

pub fn ft_app(app: AppState, cors_origins: Vec<HeaderValue>) -> Router {
    layers::ft_middleware_layers(cors_origins).with_state(app)
}
