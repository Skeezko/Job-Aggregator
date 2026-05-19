use serde::{Deserialize, Serialize};
use sqlx::Type;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Type, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[sqlx(type_name = "contract_type", rename_all = "snake_case")]
pub enum ContractType {
    Internship,
    Apprenticeship,
    FullTime,
    Freelance,
    Unknown,
}

#[derive(Type, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[sqlx(type_name = "remote_policy", rename_all = "lowercase")]
pub enum RemotePolicy {
    Onsite,
    Hybrid,
    Remote,
    Unknown,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Offer {
    pub id: Uuid,
    pub source: String,
    pub source_id: String,
    pub title: String,
    pub description: String,
    pub company: Option<String>,
    pub location_city: Option<String>,
    pub location_country: Option<String>,
    pub remote_policy: RemotePolicy,
    pub contract_type: ContractType,
    pub salary_min: Option<i32>,
    pub salary_max: Option<i32>,
    pub salary_currency: Option<String>,
    pub posted_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SavedOffer {
    pub user_id: Uuid,
    pub offer_id: Uuid,
    pub notes: Option<String>,
    pub saved_at: DateTime<Utc>,
}