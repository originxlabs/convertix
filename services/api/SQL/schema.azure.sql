/* =========================
   ORGS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'orgs')
BEGIN
    CREATE TABLE orgs (
        org_id NVARCHAR(100) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        plan_tier NVARCHAR(50) NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   USERS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        user_id NVARCHAR(100) PRIMARY KEY,
        org_id NVARCHAR(100) NULL,
        email NVARCHAR(255) NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   TEAMS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'teams')
BEGIN
    CREATE TABLE teams (
        team_id NVARCHAR(100) PRIMARY KEY,
        org_id NVARCHAR(100) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   ORG MEMBERS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'org_members')
BEGIN
    CREATE TABLE org_members (
        user_id NVARCHAR(100) PRIMARY KEY,
        org_id NVARCHAR(100) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'member',
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   TEAM MEMBERS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'team_members')
BEGIN
    CREATE TABLE team_members (
        team_id NVARCHAR(100) NOT NULL,
        user_id NVARCHAR(100) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'member',
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT pk_team_members PRIMARY KEY (team_id, user_id)
    );
END;
GO

/* =========================
   TIERS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tiers')
BEGIN
    CREATE TABLE tiers (
        tier NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NOT NULL,
        sort_order INT NOT NULL
    );
END;
GO

/* =========================
   PRICING
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'pricing')
BEGIN
    CREATE TABLE pricing (
        tier NVARCHAR(50) PRIMARY KEY,
        price_monthly DECIMAL(18,2) NOT NULL,
        price_yearly DECIMAL(18,2) NOT NULL,
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        sort_order INT NOT NULL
    );
END;
GO

/* =========================
   ORG BILLING
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'org_billing')
BEGIN
    CREATE TABLE org_billing (
        org_id NVARCHAR(100) PRIMARY KEY,
        billing_email NVARCHAR(255),
        billing_cycle NVARCHAR(20) NOT NULL DEFAULT 'monthly',
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        payment_provider NVARCHAR(50),
        provider_customer_id NVARCHAR(255),
        provider_subscription_id NVARCHAR(255),
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   ORG SUBSCRIPTIONS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'org_subscriptions')
BEGIN
    CREATE TABLE org_subscriptions (
        subscription_id NVARCHAR(100) PRIMARY KEY,
        org_id NVARCHAR(100) NOT NULL,
        tier NVARCHAR(50) NOT NULL,
        status NVARCHAR(50) NOT NULL,
        billing_cycle NVARCHAR(20) NOT NULL DEFAULT 'monthly',
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        provider NVARCHAR(50) NOT NULL DEFAULT 'razorpay',
        provider_subscription_id NVARCHAR(255),
        provider_customer_id NVARCHAR(255),
        started_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        current_period_start DATETIMEOFFSET,
        current_period_end DATETIMEOFFSET,
        canceled_at DATETIMEOFFSET,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   LICENSE KEYS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'license_keys')
BEGIN
    CREATE TABLE license_keys (
        activation_key_hash NVARCHAR(256) PRIMARY KEY,
        tier NVARCHAR(50) NOT NULL,
        expires_at DATETIMEOFFSET,
        org_id NVARCHAR(100),
        grace_period_days INT NOT NULL DEFAULT 7,
        is_active BIT NOT NULL DEFAULT 1,
        last_used_at DATETIMEOFFSET,
        last_user_id NVARCHAR(100),
        last_device_id NVARCHAR(100)
    );
END;
GO

/* =========================
   USER ENTITLEMENTS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'user_entitlements')
BEGIN
    CREATE TABLE user_entitlements (
        user_id NVARCHAR(100) PRIMARY KEY,
        tier NVARCHAR(50) NOT NULL,
        expires_at DATETIMEOFFSET,
        org_id NVARCHAR(100)
    );
END;
GO

/* =========================
   USAGE EVENTS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'usage_events')
BEGIN
    CREATE TABLE usage_events (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(100) NOT NULL,
        feature NVARCHAR(100) NOT NULL,
        amount INT NOT NULL,
        month_key NVARCHAR(20) NOT NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   CREDITS WALLET
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'credits_wallet')
BEGIN
    CREATE TABLE credits_wallet (
        user_id NVARCHAR(100) PRIMARY KEY,
        balance DECIMAL(18,2) NOT NULL DEFAULT 0
    );
END;
GO

/* =========================
   CREDIT EVENTS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'credit_events')
BEGIN
    CREATE TABLE credit_events (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id NVARCHAR(100) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        reason NVARCHAR(255) NOT NULL,
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   ORG INVOICES
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'org_invoices')
BEGIN
    CREATE TABLE org_invoices (
        invoice_id NVARCHAR(100) PRIMARY KEY,
        org_id NVARCHAR(100) NOT NULL,
        user_id NVARCHAR(100),
        provider NVARCHAR(50) NOT NULL DEFAULT 'razorpay',
        provider_invoice_id NVARCHAR(255) NOT NULL,
        provider_payment_id NVARCHAR(255),
        provider_order_id NVARCHAR(255),
        amount DECIMAL(18,2) NOT NULL,
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        status NVARCHAR(50) NOT NULL,
        issued_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
        paid_at DATETIMEOFFSET,
        pdf_url NVARCHAR(1000),
        metadata NVARCHAR(MAX)
    );
END;
GO

/* =========================
   INVOICE LINE ITEMS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'invoice_line_items')
BEGIN
    CREATE TABLE invoice_line_items (
        line_item_id NVARCHAR(100) PRIMARY KEY,
        invoice_id NVARCHAR(100) NOT NULL,
        feature NVARCHAR(100) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(18,2) NOT NULL DEFAULT 0,
        amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

/* =========================
   BILLING SNAPSHOTS
   ========================= */
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'billing_snapshots')
BEGIN
    CREATE TABLE billing_snapshots (
        snapshot_id NVARCHAR(100) PRIMARY KEY,
        org_id NVARCHAR(100) NOT NULL,
        user_id NVARCHAR(100),
        month_key NVARCHAR(20) NOT NULL,
        tier NVARCHAR(50) NOT NULL,
        total_requests INT NOT NULL DEFAULT 0,
        total_tokens BIGINT NOT NULL DEFAULT 0,
        total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
        currency NVARCHAR(10) NOT NULL DEFAULT 'INR',
        created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
    );
END;
GO

ALTER TABLE users ADD CONSTRAINT fk_users_orgs FOREIGN KEY (org_id) REFERENCES orgs(org_id);
ALTER TABLE teams ADD CONSTRAINT fk_teams_orgs FOREIGN KEY (org_id) REFERENCES orgs(org_id);
ALTER TABLE org_members ADD CONSTRAINT fk_org_members_users FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE org_members ADD CONSTRAINT fk_org_members_orgs FOREIGN KEY (org_id) REFERENCES orgs(org_id);
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_users FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_teams FOREIGN KEY (team_id) REFERENCES teams(team_id);

ALTER TABLE pricing ADD CONSTRAINT fk_pricing_tiers FOREIGN KEY (tier) REFERENCES tiers(tier);
ALTER TABLE org_subscriptions ADD CONSTRAINT fk_org_subscriptions_orgs FOREIGN KEY (org_id) REFERENCES orgs(org_id);
ALTER TABLE org_subscriptions ADD CONSTRAINT fk_org_subscriptions_tiers FOREIGN KEY (tier) REFERENCES tiers(tier);

ALTER TABLE license_keys ADD CONSTRAINT fk_license_keys_tiers FOREIGN KEY (tier) REFERENCES tiers(tier);
ALTER TABLE license_keys ADD CONSTRAINT fk_license_keys_users FOREIGN KEY (last_user_id) REFERENCES users(user_id);
ALTER TABLE license_keys ADD CONSTRAINT fk_license_keys_orgs FOREIGN KEY (org_id) REFERENCES orgs(org_id);

ALTER TABLE usage_events ADD CONSTRAINT fk_usage_events_users FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE credits_wallet ADD CONSTRAINT fk_credits_wallet_users FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE credit_events ADD CONSTRAINT fk_credit_events_users FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE org_invoices ADD CONSTRAINT fk_org_invoices_orgs FOREIGN KEY (org_id) REFERENCES orgs(org_id);
ALTER TABLE org_invoices ADD CONSTRAINT fk_org_invoices_users FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE invoice_line_items ADD CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES org_invoices(invoice_id);
GO


-- 🏢 Core

-- orgs

-- users

-- teams

-- 👥 Membership & Access

-- org_members

-- team_members

-- 📦 Plans & Pricing

-- tiers

-- pricing

-- 💳 Billing & Subscriptions

-- org_billing

-- org_subscriptions

-- 🔑 Licensing & Entitlements

-- license_keys

-- user_entitlements

-- 📊 Usage & Aggregation

-- usage_events

-- billing_snapshots

-- 💰 Credits

-- credits_wallet

-- credit_events

-- 🧾 Invoicing

-- org_invoices

-- invoice_line_items