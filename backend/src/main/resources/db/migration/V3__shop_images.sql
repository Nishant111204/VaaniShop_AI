CREATE TABLE IF NOT EXISTS shop_images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id      UUID        NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL,
    data         BYTEA       NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_images_shop_id ON shop_images(shop_id);
