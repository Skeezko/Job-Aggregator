use axum::{Router, routing::post};
use secrecy::Secret;
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub mod error;
pub mod routes;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub pepper: Arc<Secret<String>>,
    pub jwt_secret: Arc<Secret<String>>,
}

pub fn ft_app(app: AppState) -> Router {
    Router::new()
        .route("/register", post(crate::routes::auth::ft_register))
        .route("/login", post(crate::routes::auth::ft_login))
        .route("/refresh", post(crate::routes::auth::ft_refresh))
        .route("/logout", post(crate::routes::auth::ft_logout))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(app)
}
