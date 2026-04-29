-- Shared trigger function: automatically updates `updated_at` on every UPDATE.
-- Defined once, reused by all tables that have an updated_at column.

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
