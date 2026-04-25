-- Quickshop migration: delivery + fulfillment + payment method fields
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fulfillment_type') THEN
    CREATE TYPE fulfillment_type AS ENUM ('PICKUP', 'DELIVERY');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('ONLINE', 'CASH');
  END IF;
END
$$;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_delivery_fee NUMERIC(12, 2) NULL,
  ADD COLUMN IF NOT EXISTS per_km_fee NUMERIC(12, 2) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stores_base_delivery_fee_nonneg'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_base_delivery_fee_nonneg CHECK (base_delivery_fee IS NULL OR base_delivery_fee >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stores_per_km_fee_nonneg'
  ) THEN
    ALTER TABLE stores
      ADD CONSTRAINT stores_per_km_fee_nonneg CHECK (per_km_fee IS NULL OR per_km_fee >= 0);
  END IF;
END
$$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_type fulfillment_type NOT NULL DEFAULT 'PICKUP',
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12, 2) NULL,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC(10, 6) NULL,
  ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC(10, 6) NULL,
  ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'ONLINE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_delivery_fee_nonneg'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_delivery_fee_nonneg CHECK (delivery_fee IS NULL OR delivery_fee >= 0);
  END IF;
END
$$;

-- Make expires_at NOT NULL (backfill existing rows first)
UPDATE orders
SET expires_at = COALESCE(expires_at, created_at + INTERVAL '24 hours')
WHERE expires_at IS NULL;

ALTER TABLE orders
  ALTER COLUMN expires_at SET NOT NULL;

