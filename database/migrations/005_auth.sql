CREATE TABLE refresh_tokens (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT         NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ  NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_agent      TEXT,
    ip_address      INET,

    CONSTRAINT expires_after_creation CHECK (expires_at > created_at)
);

CREATE INDEX idx_refresh_tokens_user        ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_active_hash ON refresh_tokens (token_hash)
    WHERE revoked_at IS NULL;


CREATE TABLE login_attempts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT       NOT NULL,
    ip_address      INET         NOT NULL,
    success         BOOLEAN      NOT NULL,
    attempted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_agent      TEXT,

    CONSTRAINT email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

CREATE INDEX idx_login_attempts_email_time  ON login_attempts (email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time     ON login_attempts (ip_address, attempted_at DESC);
