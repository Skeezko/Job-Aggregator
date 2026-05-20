use axum::{Router, routing::{get, post, delete}};
use secrecy::Secret;
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

pub mod error;
pub mod routes;

#[derive(Clone, axum::extract::FromRef)]pub struct AppState {
    pub db: PgPool,
    pub pepper: Arc<Secret<String>>,
    pub jwt_secret: Arc<Secret<String>>,
}

pub fn ft_app(app: AppState) -> Router {
    Router::new()
        ///auth routes
        .route("/register", post(crate::routes::auth::ft_register))
        .route("/login", post(crate::routes::auth::ft_login))
        .route("/refresh", post(crate::routes::auth::ft_refresh))
        .route("/logout", post(crate::routes::auth::ft_logout))

        ///route publique (offers)
        .route("/offers", get(crate::routes::offers::list_offers))

        //route user (favoris)
        .route("/offers/:offer_id/save", post(crate::routes::users::save_offer))
        .route("/users/saved-offers", get(crate::routes::users::get_saved_offers))
        .route("/users/saved-offers/:offer_id", delete(crate::routes::users::remove_saved_offer))
        .layer(CorsLayer::permissive())
        .with_state(app)
}
