use axum::{Router, routing::{get, post, delete}};
use secrecy::Secret;
use sqlx::PgPool;
use std::sync::Arc;
use axum::http::HeaderValue;

pub mod error;
pub mod layers;
pub mod routes;
pub mod security;
pub mod utils;
pub mod models;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub pepper: Arc<Secret<String>>,
    pub jwt_secret: Arc<Secret<String>>,
}

impl axum::extract::FromRef<AppState> for PgPool {
    fn from_ref(app_state: &AppState) -> PgPool {
        app_state.db.clone()
    }
}

pub fn ft_app(app: AppState, cors_origins: Vec<HeaderValue>) -> Router {
    layers::ft_middleware_layers(cors_origins).with_state(app)
}
