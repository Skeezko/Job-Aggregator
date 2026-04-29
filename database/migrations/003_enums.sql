-- All application enums in one place.
-- Adding a value to an enum requires ALTER TYPE — keep them minimal and stable.

CREATE TYPE user_role AS ENUM (
    'user',
    'admin'
);

CREATE TYPE contract_type AS ENUM (
    'cdi',
    'cdd',
    'stage',
    'apprentissage',
    'freelance',
    'interim',
    'other'
);

CREATE TYPE offer_status AS ENUM (
    'active',
    'closed',
    'archived',
    'flagged'
);

CREATE TYPE offer_source AS ENUM (
    'welovedevs',
    'manual'
);
