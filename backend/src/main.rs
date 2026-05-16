use jobaggr_backend::{AppState, ft_app};
use secrecy::Secret;
use sqlx::PgPool;
use tracing_subscriber::{EnvFilter, fmt};
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use std::error::Error;
use std::net::SocketAddr;
use std::sync::Arc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {

    let _ = dotenvy::dotenv();
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::registry().with(filter).with(fmt::layer().pretty()).init();
    tracing::info!("Starting backend");

    let pepper = dotenvy::var("PEPPER")?;
    let database_url = dotenvy::var("DATABASE_URL")?;
    let db = PgPool::connect(&database_url).await?;
    let jwt_secret = dotenvy::var("JWT_SECRET")?;

    sqlx::migrate!("./migrations").run(&db).await?;

    let app = AppState {
        db,
        pepper: Arc::new(Secret::new(pepper)),
        jwt_secret: Arc::new(Secret::new(jwt_secret)),
    };
    let app = ft_app(app);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;

    Ok(())
}
