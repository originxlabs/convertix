CREATE TABLE IF NOT EXISTS tiers (
  tier text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  sort_order int NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  user_id text PRIMARY KEY,
  org_id text NULL,
  email text NOT NULL,
  password_hash bytea NOT NULL,
  password_salt bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
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

CREATE TABLE IF NOT EXISTS orgs (
  org_id text PRIMARY KEY,
  name text NOT NULL,
  plan_tier text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  team_id text PRIMARY KEY,
  org_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  user_id text PRIMARY KEY,
  org_id text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
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

CREATE TABLE IF NOT EXISTS org_invoices (
  invoice_id text PRIMARY KEY,
  org_id text NOT NULL,
  user_id text NULL,
  provider text NOT NULL DEFAULT 'razorpay',
  provider_invoice_id text NOT NULL,
  provider_payment_id text NULL,
  provider_order_id text NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz NULL,
  pdf_url text NULL,
  metadata text NULL
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  line_item_id text PRIMARY KEY,
  invoice_id text NOT NULL,
  feature text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_snapshots (
  snapshot_id text PRIMARY KEY,
  org_id text NOT NULL,
  user_id text NULL,
  month_key text NOT NULL,
  tier text NOT NULL,
  total_requests int NOT NULL DEFAULT 0,
  total_tokens bigint NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_subscriptions (
  subscription_id text PRIMARY KEY,
  org_id text NOT NULL,
  tier text NOT NULL,
  status text NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  currency text NOT NULL DEFAULT 'INR',
  provider text NOT NULL DEFAULT 'razorpay',
  provider_subscription_id text NULL,
  provider_customer_id text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  current_period_start timestamptz NULL,
  current_period_end timestamptz NULL,
  canceled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_aggregates_daily (
  aggregate_id text PRIMARY KEY,
  org_id text NOT NULL,
  user_id text NULL,
  usage_date date NOT NULL,
  feature text NOT NULL,
  requests int NOT NULL DEFAULT 0,
  tokens bigint NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS token_revocations (
  jti text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
