-- Atria CRM - Complete Multi-Tenant Schema for Supabase
-- Idempotent SQL script for production deployment

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
DO $$ BEGIN CREATE EXTENSION postgis; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Enums
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','unqualified','won','lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE deal_status AS ENUM ('open','under_contract','closed_won','closed_lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('house','apartment','studio','land','commercial','warehouse','farm','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('draft','available','reserved','under_offer','sold','rented','off_market');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM ('draft','unpublished','published','paused','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE visit_status AS ENUM ('scheduled','done','no_show','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('sale','rent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM ('draft','active','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft','open','paid','void','overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Multi-tenant access functions
CREATE OR REPLACE FUNCTION is_admin_global(uid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_roles 
        WHERE user_id = uid 
        AND role = 'global_admin' 
        AND agency_id IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_agency_access(aid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agency_members 
        WHERE agency_id = aid 
        AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM app_roles 
        WHERE agency_id = aid 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agency_admin(aid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agency_members 
        WHERE agency_id = aid 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    ) OR EXISTS (
        SELECT 1 FROM app_roles 
        WHERE agency_id = aid 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_agency_write_access(aid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agency_members 
        WHERE agency_id = aid 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager', 'agent')
    ) OR EXISTS (
        SELECT 1 FROM app_roles 
        WHERE agency_id = aid 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin', 'manager', 'agent')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        LOWER(SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tables
CREATE TABLE IF NOT EXISTS agencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug citext NOT NULL UNIQUE,
    about text,
    country text DEFAULT 'BR',
    timezone text DEFAULT 'America/Sao_Paulo',
    owner_id uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    username citext UNIQUE,
    avatar_url text,
    phone text,
    locale text DEFAULT 'pt-BR',
    timezone text DEFAULT 'America/Sao_Paulo',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('global_admin','owner','admin','manager','agent','viewer','moderator')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS agency_members (
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner','admin','manager','agent','viewer')) DEFAULT 'agent',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agency_id, user_id)
);

CREATE TABLE IF NOT EXISTS contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('person','company')) DEFAULT 'person',
    full_name text NOT NULL,
    trade_name text,
    document text,
    emails text[],
    phones text[],
    tags text[],
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipelines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, name)
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name text NOT NULL,
    position int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (pipeline_id, name)
);

CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    source text,
    status lead_status DEFAULT 'new',
    assigned_to uuid REFERENCES auth.users(id),
    score int,
    budget_min numeric(14,2),
    budget_max numeric(14,2),
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    pipeline_id uuid NOT NULL REFERENCES pipelines(id),
    stage_id uuid REFERENCES pipeline_stages(id),
    lead_id uuid REFERENCES leads(id),
    agent_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    value numeric(14,2),
    currency text DEFAULT 'BRL',
    status deal_status DEFAULT 'open',
    close_date date,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    type property_type NOT NULL,
    status property_status DEFAULT 'available',
    title text NOT NULL,
    description text,
    price_sale numeric(14,2),
    price_rent numeric(14,2),
    condo_fee numeric(14,2),
    iptu numeric(14,2),
    area_total numeric(10,2),
    area_built numeric(10,2),
    rooms int,
    suites int,
    bathrooms int,
    parking int,
    year_built int,
    features jsonb,
    docs jsonb,
    address_line1 text,
    address_line2 text,
    district text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'BR',
    location geography(Point,4326),
    search tsvector,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_owners (
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    ownership_pct numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (property_id, contact_id)
);

CREATE TABLE IF NOT EXISTS property_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('image','video','doc')),
    bucket text NOT NULL,
    path text NOT NULL,
    mime_type text,
    size_bytes bigint,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (bucket, path)
);

CREATE TABLE IF NOT EXISTS listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    status listing_status DEFAULT 'draft',
    channel text CHECK (channel IN ('site','olx','zap','instagram','facebook','tiktok','portal_other')),
    published_at timestamptz,
    expires_at timestamptz,
    external_id text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id),
    contact_id uuid REFERENCES contacts(id),
    scheduled_for timestamptz NOT NULL,
    status visit_status DEFAULT 'scheduled',
    feedback text,
    agent_id uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES deals(id),
    buyer_contact_id uuid NOT NULL REFERENCES contacts(id),
    type text NOT NULL CHECK (type IN ('sale','rent')),
    amount numeric(14,2) NOT NULL,
    currency text DEFAULT 'BRL',
    expires_at date,
    status text DEFAULT 'submitted' CHECK (status IN ('submitted','accepted','rejected','withdrawn')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    buyer_contact_id uuid NOT NULL REFERENCES contacts(id),
    seller_contact_id uuid NOT NULL REFERENCES contacts(id),
    type contract_type NOT NULL,
    status contract_status DEFAULT 'draft',
    signed_at timestamptz,
    start_at timestamptz,
    end_at timestamptz,
    terms jsonb,
    files jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES auth.users(id),
    percentage numeric(5,2),
    amount numeric(14,2),
    status text DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contract_id uuid REFERENCES contracts(id),
    contact_id uuid REFERENCES contacts(id),
    amount numeric(14,2) NOT NULL,
    currency text DEFAULT 'BRL',
    due_date date,
    status invoice_status DEFAULT 'open',
    external_ref text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('call','meeting','task','note','email','whatsapp','followup')),
    title text NOT NULL,
    description text,
    due_at timestamptz,
    completed_at timestamptz,
    lead_id uuid REFERENCES leads(id),
    deal_id uuid REFERENCES deals(id),
    property_id uuid REFERENCES properties(id),
    contact_id uuid REFERENCES contacts(id),
    agent_id uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    entity text NOT NULL CHECK (entity IN ('lead','deal','property','contact','contract','invoice')),
    entity_id uuid NOT NULL,
    author_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    url text NOT NULL,
    secret text,
    events text[],
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name text NOT NULL,
    hashed_key text NOT NULL,
    scopes text[],
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    bucket text NOT NULL,
    path text NOT NULL,
    mime_type text,
    size_bytes bigint,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (bucket, path)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid REFERENCES agencies(id),
    actor_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Property search trigger
CREATE OR REPLACE FUNCTION update_property_search()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search := to_tsvector('portuguese', 
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.city, '') || ' ' ||
        COALESCE(NEW.state, '') || ' ' ||
        COALESCE(NEW.district, '') || ' ' ||
        COALESCE(NEW.address_line1, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_agencies_updated_at') THEN
        CREATE TRIGGER set_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at') THEN
        CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_app_roles_updated_at') THEN
        CREATE TRIGGER set_app_roles_updated_at BEFORE UPDATE ON app_roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_agency_members_updated_at') THEN
        CREATE TRIGGER set_agency_members_updated_at BEFORE UPDATE ON agency_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_contacts_updated_at') THEN
        CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pipelines_updated_at') THEN
        CREATE TRIGGER set_pipelines_updated_at BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_pipeline_stages_updated_at') THEN
        CREATE TRIGGER set_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_leads_updated_at') THEN
        CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_deals_updated_at') THEN
        CREATE TRIGGER set_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_properties_updated_at') THEN
        CREATE TRIGGER set_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_properties_search') THEN
        CREATE TRIGGER update_properties_search BEFORE INSERT OR UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_property_search();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_property_media_updated_at') THEN
        CREATE TRIGGER set_property_media_updated_at BEFORE UPDATE ON property_media FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_listings_updated_at') THEN
        CREATE TRIGGER set_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_visits_updated_at') THEN
        CREATE TRIGGER set_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_offers_updated_at') THEN
        CREATE TRIGGER set_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_contracts_updated_at') THEN
        CREATE TRIGGER set_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_commissions_updated_at') THEN
        CREATE TRIGGER set_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_invoices_updated_at') THEN
        CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_activities_updated_at') THEN
        CREATE TRIGGER set_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_notes_updated_at') THEN
        CREATE TRIGGER set_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_webhooks_updated_at') THEN
        CREATE TRIGGER set_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_api_keys_updated_at') THEN
        CREATE TRIGGER set_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_files_updated_at') THEN
        CREATE TRIGGER set_files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'agencies_select_policy') THEN
        CREATE POLICY agencies_select_policy ON agencies FOR SELECT USING (has_agency_access(id) OR is_agency_admin(id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'agencies_insert_policy') THEN
        CREATE POLICY agencies_insert_policy ON agencies FOR INSERT WITH CHECK (is_admin_global(auth.uid()) OR owner_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'agencies_update_policy') THEN
        CREATE POLICY agencies_update_policy ON agencies FOR UPDATE USING (is_agency_admin(id) OR is_admin_global(auth.uid())) WITH CHECK (is_agency_admin(id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'agencies_delete_policy') THEN
        CREATE POLICY agencies_delete_policy ON agencies FOR DELETE USING (is_agency_admin(id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_policy') THEN
        CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (id = auth.uid() OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_policy') THEN
        CREATE POLICY profiles_insert_policy ON profiles FOR INSERT WITH CHECK (id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy') THEN
        CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'contacts_select_policy') THEN
        CREATE POLICY contacts_select_policy ON contacts FOR SELECT USING (has_agency_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'contacts_insert_policy') THEN
        CREATE POLICY contacts_insert_policy ON contacts FOR INSERT WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'contacts_update_policy') THEN
        CREATE POLICY contacts_update_policy ON contacts FOR UPDATE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid())) WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contacts' AND policyname = 'contacts_delete_policy') THEN
        CREATE POLICY contacts_delete_policy ON contacts FOR DELETE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'properties_select_policy') THEN
        CREATE POLICY properties_select_policy ON properties FOR SELECT USING (has_agency_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'properties_insert_policy') THEN
        CREATE POLICY properties_insert_policy ON properties FOR INSERT WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'properties_update_policy') THEN
        CREATE POLICY properties_update_policy ON properties FOR UPDATE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid())) WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'properties' AND policyname = 'properties_delete_policy') THEN
        CREATE POLICY properties_delete_policy ON properties FOR DELETE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_select_policy') THEN
        CREATE POLICY leads_select_policy ON leads FOR SELECT USING (has_agency_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_insert_policy') THEN
        CREATE POLICY leads_insert_policy ON leads FOR INSERT WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_update_policy') THEN
        CREATE POLICY leads_update_policy ON leads FOR UPDATE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid())) WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_delete_policy') THEN
        CREATE POLICY leads_delete_policy ON leads FOR DELETE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'deals_select_policy') THEN
        CREATE POLICY deals_select_policy ON deals FOR SELECT USING (has_agency_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'deals_insert_policy') THEN
        CREATE POLICY deals_insert_policy ON deals FOR INSERT WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'deals_update_policy') THEN
        CREATE POLICY deals_update_policy ON deals FOR UPDATE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid())) WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'deals_delete_policy') THEN
        CREATE POLICY deals_delete_policy ON deals FOR DELETE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_app_roles_agency_user ON app_roles(agency_id, user_id);
CREATE INDEX IF NOT EXISTS idx_app_roles_user_role ON app_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contacts_emails ON contacts USING GIN(emails);
CREATE INDEX IF NOT EXISTS idx_contacts_phones ON contacts USING GIN(phones);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_pipelines_agency_id ON pipelines(agency_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_agency_status_assigned ON leads(agency_id, status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_agency_status_stage ON deals(agency_id, status, stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_agent_id ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_agency_status_type ON properties(agency_id, status, type);
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN(search);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_property_owners_property_id ON property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_contact_id ON property_owners(contact_id);
CREATE INDEX IF NOT EXISTS idx_property_media_property_id ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_agency_id ON property_media(agency_id);
CREATE INDEX IF NOT EXISTS idx_listings_agency_status_channel ON listings(agency_id, status, channel);
CREATE INDEX IF NOT EXISTS idx_listings_property_id ON listings(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_agency_status_scheduled ON visits(agency_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_visits_property_id ON visits(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_agent_id ON visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_offers_agency_id ON offers(agency_id);
CREATE INDEX IF NOT EXISTS idx_offers_property_id ON offers(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agency_id ON commissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_commissions_contract_id ON commissions(contract_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agency_status_due ON invoices(agency_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_activities_agency_id ON activities(agency_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_at ON activities(due_at);
CREATE INDEX IF NOT EXISTS idx_activities_agent_id ON activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_notes_agency_entity ON notes(agency_id, entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_author_id ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_agency_id ON webhooks(agency_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_agency_id ON api_keys(agency_id);
CREATE INDEX IF NOT EXISTS idx_files_agency_id ON files(agency_id);
CREATE INDEX IF NOT EXISTS idx_files_owner_id ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_agency_id ON audit_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- Public view for listings
CREATE OR REPLACE VIEW public_listings_v AS
SELECT 
    p.id as property_id,
    p.title,
    p.type,
    p.status,
    p.price_sale,
    p.price_rent,
    p.city,
    p.state,
    p.features,
    (SELECT pm.bucket || '/' || pm.path FROM property_media pm WHERE pm.property_id = p.id AND pm.kind = 'image' ORDER BY pm.created_at LIMIT 1) as cover_url
FROM properties p
JOIN listings l ON l.property_id = p.id
WHERE l.status = 'published'
AND p.status IN ('available', 'reserved', 'under_offer');

-- Seeds
INSERT INTO agencies (id, name, slug, about, owner_id) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Atria Padrão',
    'atria-padrao',
    'Agência padrão do sistema Atria CRM',
    NULL
) ON CONFLICT (name) DO NOTHING;

INSERT INTO pipelines (id, agency_id, name, is_default)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Pipeline Padrão',
    true
) ON CONFLICT (agency_id, name) DO NOTHING;

INSERT INTO pipeline_stages (pipeline_id, name, position) VALUES
('00000000-0000-0000-0000-000000000001', 'Novo', 1),
('00000000-0000-0000-0000-000000000001', 'Contato', 2),
('00000000-0000-0000-0000-000000000001', 'Qualificado', 3),
('00000000-0000-0000-0000-000000000001', 'Proposta', 4),
('00000000-0000-0000-0000-000000000001', 'Fechamento', 5)
ON CONFLICT (pipeline_id, name) DO NOTHING;
