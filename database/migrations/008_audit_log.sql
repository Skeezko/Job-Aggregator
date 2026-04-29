-- Audit log: immutable record of admin moderation actions.
--
-- Required for the admin interface (subject page 4) and counts as evidence
-- for the "action/event logging" bonus (subject page 8).
--
-- Design choices:
--   - actor_user_id SET NULL on user deletion: the log entry survives even if
--     the admin account is removed (audit trail must not be lossy)
--   - No UPDATE or DELETE should ever be issued on this table (append-only)
--   - metadata JSONB holds action-specific data (e.g. previous status, reason)
--   - target_type + target_id are generic: one table handles moderation of
--     offers, users, or any future entity

CREATE TABLE audit_log (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
    action          TEXT         NOT NULL,
    target_type     TEXT         NOT NULL,
    target_id       UUID,
    metadata        JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT action_not_empty       CHECK (char_length(action)      > 0),
    CONSTRAINT target_type_not_empty  CHECK (char_length(target_type) > 0)
);

CREATE INDEX idx_audit_log_actor    ON audit_log (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_log_target   ON audit_log (target_type, target_id);
CREATE INDEX idx_audit_log_created  ON audit_log (created_at DESC);
