
-- Migration: offers + user profiles + saved offers + ingestion
-- Extension for embeddings (ia part)

CREATE EXTENSION IF NOT EXISTS vector;

-- ENUMs (same pattern as user_role)
CREATE TYPE contract_type AS ENUM (
    'internship', 'apprenticeship', 'full_time', 'freelance', 'unknown'
);

CREATE TYPE remote_policy AS ENUM (
    'onsite', 'hybrid', 'remote', 'unknown'
);

CREATE TYPE ingestion_status AS ENUM (
    'running', 'success', 'failed'
);

-- OFFERS

CREATE TABLE offers (
    id                 UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    source             TEXT            NOT NULL,
    source_id          TEXT            NOT NULL,
    title              TEXT            NOT NULL,
    description        TEXT            NOT NULL,
    company            TEXT,
    location_city      TEXT,
    location_country   TEXT,
    remote_policy      remote_policy   NOT NULL DEFAULT 'unknown',
    contract_type      contract_type   NOT NULL DEFAULT 'unknown',
    salary_min         INTEGER,
    salary_max         INTEGER,
    salary_currency    CHAR(3),
    posted_at          TIMESTAMPTZ,
    embedding          vector(384),                              -- MiniLM dim
    raw                JSONB           NOT NULL,                 -- original payload
    is_active          BOOLEAN         NOT NULL DEFAULT TRUE,    -- admin soft-delete
    created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    
    UNIQUE (source, source_id),
    CONSTRAINT title_length        CHECK (length(title) BETWEEN 1 AND 500),
    CONSTRAINT description_length  CHECK (length(description) BETWEEN 1 AND 50000),
    CONSTRAINT salary_range        CHECK (
        salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max
    ),
    CONSTRAINT salary_positive     CHECK (salary_min IS NULL OR salary_min > 0),
    CONSTRAINT currency_format     CHECK (
        salary_currency IS NULL OR salary_currency ~ '^[A-Z]{3}$'
    )
);
CREATE TRIGGER update_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for frequent filters
CREATE INDEX idx_offers_contract   ON offers(contract_type);
CREATE INDEX idx_offers_remote     ON offers(remote_policy);
CREATE INDEX idx_offers_city       ON offers(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX idx_offers_posted     ON offers(posted_at DESC NULLS LAST);
CREATE INDEX idx_offers_active     ON offers(created_at DESC) WHERE is_active = TRUE;

-- ANN index for scoring / recommendation / deduplication
CREATE INDEX idx_offers_embedding
    ON offers USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- USER_PROFILES
CREATE TABLE user_profiles (
    user_id            UUID            PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skills             TEXT[]          NOT NULL DEFAULT '{}',
    desired_role       TEXT,
    experience_years   INTEGER,
    preferred_location TEXT,
    preferred_remote   remote_policy   NOT NULL DEFAULT 'unknown',
    updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    
    CONSTRAINT skills_count           CHECK (cardinality(skills) <= 50),
    CONSTRAINT desired_role_length    CHECK (desired_role IS NULL OR length(desired_role) <= 200),
    CONSTRAINT experience_range       CHECK (experience_years IS NULL OR experience_years BETWEEN 0 AND 70),
    CONSTRAINT preferred_loc_length   CHECK (preferred_location IS NULL OR length(preferred_location) <= 200)
);
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_user_profiles_skills ON user_profiles USING GIN (skills);

-- SAVED_OFFERS 

CREATE TABLE saved_offers (
    user_id     UUID         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    offer_id    UUID         NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    notes       TEXT,
    saved_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (user_id, offer_id),
    CONSTRAINT notes_length CHECK (notes IS NULL OR length(notes) <= 2000)
);

CREATE INDEX idx_saved_offers_user ON saved_offers(user_id, saved_at DESC);


CREATE TABLE ingestion_runs (
    id                 UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by       UUID              REFERENCES users(id) ON DELETE SET NULL,
    source             TEXT              NOT NULL DEFAULT 'welovedevs',
    started_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    finished_at        TIMESTAMPTZ,
    status             ingestion_status  NOT NULL DEFAULT 'running',
    total_fetched      INTEGER           NOT NULL DEFAULT 0,
    total_normalized   INTEGER           NOT NULL DEFAULT 0,
    inserted           INTEGER           NOT NULL DEFAULT 0,
    updated            INTEGER           NOT NULL DEFAULT 0,
    errors             INTEGER           NOT NULL DEFAULT 0,
    error_message      TEXT
);

CREATE INDEX idx_ingestion_runs_recent ON ingestion_runs(started_at DESC);
CREATE INDEX idx_ingestion_runs_running ON ingestion_runs(started_at) WHERE status = 'running';