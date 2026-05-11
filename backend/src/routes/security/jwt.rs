use crate::{error::AppError, routes::auth::UserRole};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::{Duration, Utc};
use hex;
use jsonwebtoken::{EncodingKey, Header};
use rand::Rng;
use secrecy::{ExposeSecret, Secret};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub role: UserRole,
    pub exp: usize,
    pub iat: usize,
    pub jti: Uuid,
}

pub fn ft_generate_access_token(
    secret: &Secret<String>,
    user_id: Uuid,
    user_role: UserRole,
) -> Result<String, AppError> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        role: user_role,
        exp: (now + Duration::minutes(15)).timestamp() as usize,
        iat: now.timestamp() as usize,
        jti: Uuid::new_v4(),
    };

    let token = jsonwebtoken::encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.expose_secret().as_bytes()),
    )?;

    Ok(token)
}

pub fn ft_generate_refresh_token() -> (String, String) {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    let token = URL_SAFE_NO_PAD.encode(bytes);
    let encoded_token = hex::encode(Sha256::digest(token.as_bytes()));

    (token, encoded_token)
}
