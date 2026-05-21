use crate::AppState;
use axum::http::StatusCode;
use axum::http::{HeaderName, HeaderValue, Method, Request, header};
use axum::Router;
use std::time::Duration;
use tower::ServiceBuilder;
use tower_governor::key_extractor::SmartIpKeyExtractor;
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};
use tower_http::compression::CompressionLayer;
use tower_http::cors::CorsLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::TraceLayer;

pub fn ft_middleware_layers(cors_origins: Vec<HeaderValue>) -> Router<AppState> {
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
        .route("/register", axum::routing::post(crate::routes::auth::ft_register))
        .route("/login", axum::routing::post(crate::routes::auth::ft_login))
        .layer(GovernorLayer::new(governor_auth_conf));

    let permissive_routes = Router::new()
        .route("/refresh", axum::routing::post(crate::routes::auth::ft_refresh))
        .route("/logout", axum::routing::post(crate::routes::auth::ft_logout))
        .layer(GovernorLayer::new(governor_conf));

    let middleware_layers = ServiceBuilder::new()
        .layer(SetRequestIdLayer::new(
            HeaderName::from_static("x-request-id"),
            MakeRequestUuid,
        ))
        .layer(
            TraceLayer::new_for_http().make_span_with(|request: &Request<_>| {
                let request_id = request
                    .headers()
                    .get("x-request-id")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("unknown");
                tracing::info_span!(
                    "request",
                    method = %request.method(),
                    uri = %request.uri(),
                    request_id = %request_id,
                )
            }),
        )
        .layer(PropagateRequestIdLayer::new(HeaderName::from_static(
            "x-request-id",
        )))
        .layer(RequestBodyLimitLayer::new(4096))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(10),
        ))
        .layer(CompressionLayer::new())
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
        .layer(cors);

    // How to use middleware.rs for auth
    // let example_route = Router::new().route("/example", get(crate::routes::example::ft_example))
    // and in example.rs the function should be lked this:  pub async fn ft_example(user: AuthUser)
    let api_routes = Router::new()
        .route("/offers", axum::routing::get(crate::routes::offers::list_offers))
        .route("/offers/{offer_id}/save", axum::routing::post(crate::routes::users::save_offer))
        .route("/users/saved-offers", axum::routing::get(crate::routes::users::get_saved_offers))
        .route("/users/saved-offers/{offer_id}", axum::routing::delete(crate::routes::users::remove_saved_offer))
        .route("/admin/offers/{offer_id}/disable", axum::routing::patch(crate::routes::admin::disable_offer))
        .route("/admin/users", axum::routing::get(crate::routes::admin::list_users))
        .route("/auth/me", axum::routing::get(crate::routes::auth::ft_me));

    Router::new()
        .merge(strict_routes)
        .merge(permissive_routes)
        .merge(api_routes)
        .layer(middleware_layers)
}
