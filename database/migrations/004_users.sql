-- Users: authentication, identity, and RBAC.
--
-- Security notes:
--   - email stored as CITEXT (case-insensitive, no manual lowercasing needed)
--   - password_hash must be a bcrypt hash ($2b$ prefix, 60 chars)
--     the backend must NEVER store plaintext or non-bcrypt hashes
--   - is_active allows soft-disable without cascading deletes
--   - email_verified prevents unconfirmed accounts from full access

CREATE TABLE users (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT       NOT NULL UNIQUE,
    password_hash       TEXT         NOT NULL,
    name                TEXT,
    role                user_role    NOT NULL DEFAULT 'user',
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT email_format     CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT email_length     CHECK (char_length(email) <= 254),
    -- bcrypt hashes are always exactly 60 characters and start with $2b$
    CONSTRAINT password_bcrypt  CHECK (password_hash ~ '^\$2[aby]\$[0-9]{2}\$.{53}$'),
    CONSTRAINT name_length      CHECK (name IS NULL OR char_length(name) <= 100)
);

CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_active_role  ON users (role) WHERE is_active = TRUE;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
