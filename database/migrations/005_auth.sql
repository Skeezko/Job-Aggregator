-- Authentication tables: refresh tokens + brute-force protection.
--
-- refresh_tokens:
--   - token_hash stores SHA-256(token), never the raw token
--   - soft-revocable (revoked_at) to support rotation logs and audit
--   - ip_address + user_agent stored for anomaly detection (bonus: monitoring)
--
-- login_attempts:
--   Required by the security section of the subject (brute-force mitigation).
--   The backend counts failed attempts per email within a sliding window and
--   either delays or blocks further attempts (e.g. 5 failures in 15 minutes).
--   Successful login resets the counter for that email.

-- ---------------------------------------------------------------------------
-- Refresh tokens
-- ---------------------------------------------------------------------------
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


-- ---------------------------------------------------------------------------
-- Login attempts (brute-force mitigation)
-- ---------------------------------------------------------------------------
CREATE TABLE login_attempts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT       NOT NULL,
    ip_address      INET         NOT NULL,
    success         BOOLEAN      NOT NULL,
    attempted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    user_agent      TEXT,

    CONSTRAINT email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Query pattern: COUNT failures WHERE email = ? AND attempted_at > NOW() - interval
CREATE INDEX idx_login_attempts_email_time  ON login_attempts (email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time     ON login_attempts (ip_address, attempted_at DESC);
