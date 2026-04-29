-- Extensions must be created before any table that depends on them.
-- citext  : case-insensitive TEXT (emails stored and compared without lowercasing)
-- pgcrypto: gen_random_uuid() — cryptographically secure UUID v4
-- pg_trgm : trigram GIN indexes — powers fuzzy title/company search

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
