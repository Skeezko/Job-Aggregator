use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use hmac::{Hmac, Mac};
use sha2::Sha256;
type HmacSha256 = Hmac<Sha256>;
use crate::error::AppError;
use secrecy::{ExposeSecret, Secret};
use std::sync::Arc;

pub fn ft_hash_password(password: String, pepper: Arc<Secret<String>>) -> Result<String, AppError> {
    let mut mac = HmacSha256::new_from_slice(&pepper.expose_secret().as_bytes())
        .map_err(|e| AppError::Hash(format!("HMAC init failed: {e}")))?;
    mac.update(password.as_bytes());
    let peppered_password = mac.finalize().into_bytes();

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(&peppered_password, &salt)
        .map_err(|e| AppError::Hash(format!("Argon2 hash failed: {}", e)))?
        .to_string();

    Ok(password_hash)
}

pub fn ft_check_password(
    hashed_password: String,
    password: String,
    pepper: Arc<Secret<String>>,
) -> Result<bool, AppError> {
    let mut mac = HmacSha256::new_from_slice(&pepper.expose_secret().as_bytes())
        .map_err(|e| AppError::Hash(format!("HMAC init failed: {}", e)))?;
    mac.update(password.as_bytes());
    let peppered_password = mac.finalize().into_bytes();

    let parsed_hash = PasswordHash::new(&hashed_password)
        .map_err(|e| AppError::Hash(format!("Invalid hash format: {}", e)))?;
    Ok(Argon2::default()
        .verify_password(&peppered_password, &parsed_hash)
        .is_ok())
}
