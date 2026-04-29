-- User ↔ Offer bookmarks (N:N).
--
-- Enables the "personal features" for the USER role (subject page 4).
-- Composite primary key prevents duplicate bookmarks without a separate UNIQUE.
-- Cascade on both sides: deleting a user or an offer cleans up silently.

CREATE TABLE user_offer_bookmarks (
    user_id         UUID         NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    offer_id        UUID         NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    bookmarked_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    notes           TEXT,

    PRIMARY KEY (user_id, offer_id),

    CONSTRAINT notes_length CHECK (notes IS NULL OR char_length(notes) <= 2000)
);

CREATE INDEX idx_bookmarks_by_user  ON user_offer_bookmarks (user_id,  bookmarked_at DESC);
CREATE INDEX idx_bookmarks_by_offer ON user_offer_bookmarks (offer_id);
