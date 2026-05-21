use serde::Deserialize;

#[derive(Deserialize, Debug, Clone, Default)]
pub struct Pagination {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}