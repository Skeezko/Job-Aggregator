use axum::http::{HeaderValue, Method, header};
use axum::{Router, routing::post};
use secrecy::Secret;
use sqlx::PgPool;
use std::sync::Arc;
use std::time::Duration;
use tower_governor::key_extractor::SmartIpKeyExtractor;
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};
use tower_http::cors::CorsLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::trace::TraceLayer;

pub mod error;
pub mod routes;
pub mod utils;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub pepper: Arc<Secret<String>>,
    pub jwt_secret: Arc<Secret<String>>,
}

pub fn ft_app(app: AppState, cors_origins: Vec<HeaderValue>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(cors_origins)
        .allow_methods([Method::GET, Method::POST, Method::PATCH, Method::DELETE])
        .allow_credentials(true)
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::ACCEPT])
        .max_age(Duration::from_secs(60) * 10);

    let governor_auth_conf = GovernorConfigBuilder::default()
        .per_second(10)
        .burst_size(6)
        .key_extractor(SmartIpKeyExtractor)
        .finish()
        .unwrap();
    let governor_conf = GovernorConfigBuilder::default()
        .per_second(1)
        .burst_size(60)
        .key_extractor(SmartIpKeyExtractor)
        .finish()
        .unwrap();

    let strict_routes = Router::new()
        .route("/register", post(crate::routes::auth::ft_register))
        .route("/login", post(crate::routes::auth::ft_login))
        .layer(GovernorLayer::new(governor_auth_conf));

    let permissive_routes = Router::new()
        .route("/refresh", post(crate::routes::auth::ft_refresh))
        .route("/logout", post(crate::routes::auth::ft_logout))
        .layer(GovernorLayer::new(governor_conf));

    Router::new()
        .merge(strict_routes)
        .merge(permissive_routes)
        .layer(RequestBodyLimitLayer::new(4096))
        .layer(SetResponseHeaderLayer::overriding(
            header::X_CONTENT_TYPE_OPTIONS,
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::X_FRAME_OPTIONS,
            HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            header::REFERRER_POLICY,
            HeaderValue::from_static("strict-origin-when-cross-origin"),
        ))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(app)
}
