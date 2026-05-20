CREATE TABLE offers (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    source              offer_source    NOT NULL,
    external_id         TEXT            NOT NULL,
    source_url          TEXT,
    title               TEXT            NOT NULL,
    description         TEXT            NOT NULL,
    company             TEXT            NOT NULL,
    location            TEXT,
    contract_type       contract_type,
    salary_min          INTEGER,
    salary_max          INTEGER,
    salary_currency     CHAR(3)         DEFAULT 'EUR',
    salary_period       TEXT,
    posted_at           TIMESTAMPTZ     NOT NULL,
    expires_at          TIMESTAMPTZ,
    ingested_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    status              offer_status    NOT NULL DEFAULT 'active',
    ai_category         TEXT,
    ai_keywords         TEXT[],
    ai_processed_at     TIMESTAMPTZ,
    raw_payload         JSONB,

    CONSTRAINT unique_source_external   UNIQUE (source, external_id),
    CONSTRAINT title_length             CHECK (char_length(title) BETWEEN 1 AND 500),
    CONSTRAINT description_not_empty    CHECK (char_length(description) > 0),
    CONSTRAINT company_length           CHECK (char_length(company) BETWEEN 1 AND 200),
    CONSTRAINT salary_range_valid       CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    CONSTRAINT salary_non_negative      CHECK (
        (salary_min IS NULL OR salary_min >= 0) AND
        (salary_max IS NULL OR salary_max >= 0)
    ),
    CONSTRAINT currency_iso4217         CHECK (salary_currency IS NULL OR salary_currency ~ '^[A-Z]{3}$'),
    CONSTRAINT salary_period_valid      CHECK (salary_period IS NULL OR salary_period IN ('hour', 'day', 'month', 'year')),
    CONSTRAINT expires_after_posted     CHECK (expires_at IS NULL OR expires_at > posted_at)
);

CREATE INDEX idx_offers_status          ON offers (status);
CREATE INDEX idx_offers_posted_at       ON offers (posted_at DESC);
CREATE INDEX idx_offers_company         ON offers (company);
CREATE INDEX idx_offers_contract_type   ON offers (contract_type)  WHERE contract_type IS NOT NULL;
CREATE INDEX idx_offers_location        ON offers (location)        WHERE location IS NOT NULL;
CREATE INDEX idx_offers_salary_min      ON offers (salary_min)      WHERE salary_min IS NOT NULL;
CREATE INDEX idx_offers_ai_category     ON offers (ai_category)     WHERE ai_category IS NOT NULL;
CREATE INDEX idx_offers_title_trgm      ON offers USING GIN (title   gin_trgm_ops);
CREATE INDEX idx_offers_company_trgm    ON offers USING GIN (company  gin_trgm_ops);
CREATE INDEX idx_offers_ai_keywords     ON offers USING GIN (ai_keywords);

CREATE TRIGGER trg_offers_updated_at
    BEFORE UPDATE ON offers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
