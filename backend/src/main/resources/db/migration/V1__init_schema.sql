CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shops (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name  VARCHAR(255) NOT NULL,
    category   VARCHAR(100),
    data       JSONB        NOT NULL DEFAULT '{}',
    owner_id   UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id   ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_created_at ON shops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shops_data_gin   ON shops USING gin(data);
