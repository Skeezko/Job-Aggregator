use jobaggr_backend::{AppState, ft_app};
use secrecy::Secret;
use sqlx::PgPool;
use std::error::Error;
use std::net::SocketAddr;
use std::sync::Arc;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::{EnvFilter, fmt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let _ = dotenvy::dotenv();
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().pretty())
        .init();
    tracing::info!("Starting backend");

    let pepper = dotenvy::var("PEPPER")?;
    let database_url = dotenvy::var("DATABASE_URL")?;
    let db = PgPool::connect(&database_url).await?;
    let jwt_secret = dotenvy::var("JWT_SECRET")?;
    let cors_origins = dotenvy::var("CORS_ALLOWED_ORIGINS")?
        .split(',')
        .filter_map(|origin| origin.trim().parse().ok())
        .collect();

    sqlx::migrate!("./migrations").run(&db).await?;

    let app = AppState {
        db,
        pepper: Arc::new(Secret::new(pepper)),
        jwt_secret: Arc::new(Secret::new(jwt_secret)),
    };
    let app = ft_app(app, cors_origins);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}
