CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto; 

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TABLE users (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   CITEXT       UNIQUE NOT NULL,
    password_hash           TEXT         NOT NULL,
    firstname               TEXT        NOT NULL,
    lastname                TEXT        NOT NULL,
    role                    user_role    NOT NULL DEFAULT 'user',
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_users_email ON users(email);


CREATE TABLE refresh_tokens (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT         UNIQUE NOT NULL,
    device_info     TEXT,
    ip_address      INET,
    expires_at      TIMESTAMPTZ  NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE INDEX idx_refresh_tokens_active_hash ON refresh_tokens(token_hash)
    WHERE revoked_at IS NULL;