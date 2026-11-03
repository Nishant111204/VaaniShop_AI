-- Anonymous daily counters per shop. No visitor data is stored.
CREATE TABLE IF NOT EXISTS shop_daily_stats (
    shop_id    UUID    NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    day        DATE    NOT NULL,
    visits     INTEGER NOT NULL DEFAULT 0,
    orders     INTEGER NOT NULL DEFAULT 0,
    whatsapp   INTEGER NOT NULL DEFAULT 0,
    calls      INTEGER NOT NULL DEFAULT 0,
    directions INTEGER NOT NULL DEFAULT 0,
    shares     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (shop_id, day)
);
