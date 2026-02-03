CREATE TABLE IF NOT EXISTS tiers (
  tier text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  sort_order int NOT NULL
);

CREATE TABLE IF NOT EXISTS pricing (
  tier text PRIMARY KEY,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  currency text NOT NULL,
  sort_order int NOT NULL
);

CREATE TABLE IF NOT EXISTS license_keys (
  activation_key_hash text PRIMARY KEY,
  tier text NOT NULL,
  expires_at timestamptz NULL,
  org_id text NULL,
  grace_period_days int NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz NULL,
  last_user_id text NULL,
  last_device_id text NULL
);

CREATE TABLE IF NOT EXISTS user_entitlements (
  user_id text PRIMARY KEY,
  tier text NOT NULL,
  expires_at timestamptz NULL,
  org_id text NULL
);

CREATE TABLE IF NOT EXISTS usage_events (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  feature text NOT NULL,
  amount int NOT NULL,
  month_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credits_wallet (
  user_id text PRIMARY KEY,
  balance numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS credit_events (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
