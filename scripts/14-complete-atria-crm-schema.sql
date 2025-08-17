-- Atria CRM Imobiliário Multi-Tenant - Schema Completo
-- Compatível com Supabase (PostgreSQL 15)

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Enums
CREATE TYPE IF NOT EXISTS lead_status AS ENUM ('new','contacted','qualified','unqualified','won','lost');
CREATE TYPE IF NOT EXISTS deal_status AS ENUM ('open','under_contract','closed_won','closed_lost');
CREATE TYPE IF NOT EXISTS property_type AS ENUM ('house','apartment','studio','land','commercial','warehouse','farm','other');
CREATE TYPE IF NOT EXISTS property_status AS ENUM ('draft','available','reserved','under_offer','sold','rented','off_market');
CREATE TYPE IF NOT EXISTS listing_status AS ENUM ('draft','unpublished','published','paused','expired');
CREATE TYPE IF NOT EXISTS visit_status AS ENUM ('scheduled','done','no_show','cancelled');
CREATE TYPE IF NOT EXISTS contract_type AS ENUM ('sale','rent');
CREATE TYPE IF NOT EXISTS contract_status AS ENUM ('draft','active','completed','cancelled');
CREATE TYPE IF NOT EXISTS invoice_status AS ENUM ('draft','open','paid','void','overdue');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funções utilitárias multi-tenant
CREATE OR REPLACE FUNCTION is_admin_global(uid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_roles 
        WHERE user_id = uid AND role = 'global_admin' AND agency_id IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_agency_access(aid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agency_members 
        WHERE user_id = auth.uid() AND agency_id = aid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agency_admin(aid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM app_roles 
        WHERE user_id = auth.uid() AND agency_id = aid AND role IN ('owner','admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_agency_write_access(aid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agency_members 
        WHERE user_id = auth.uid() AND agency_id = aid AND role IN ('owner','admin','manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabela profiles
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

-- Tabela agencies
CREATE TABLE IF NOT EXISTS agencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    slug citext UNIQUE NOT NULL,
    about text,
    country text DEFAULT 'BR',
    timezone text DEFAULT 'America/Sao_Paulo',
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela app_roles
CREATE TABLE IF NOT EXISTS app_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner','admin','manager','agent','viewer','moderator','global_admin')),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, user_id, role)
);

-- Tabela agency_members
CREATE TABLE IF NOT EXISTS agency_members (
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner','admin','manager','agent','viewer')) DEFAULT 'agent',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (agency_id, user_id)
);

-- Tabela contacts
CREATE TABLE IF NOT EXISTS contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('person','company')) DEFAULT 'person',
    full_name text,
    trade_name text,
    document text,
    emails text[],
    phones text[],
    tags text[],
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela leads
CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
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

-- Tabela pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (agency_id, name)
);

-- Tabela pipeline_stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name text NOT NULL,
    position int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (pipeline_id, name)
);

-- Tabela deals
CREATE TABLE IF NOT EXISTS deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    stage_id uuid NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES auth.users(id),
    title text NOT NULL,
    value numeric(14,2),
    currency text DEFAULT 'BRL',
    status deal_status DEFAULT 'open',
    close_date date,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela properties
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
    search tsvector,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Adicionar coluna location se postgis disponível
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        ALTER TABLE properties ADD COLUMN IF NOT EXISTS location geography(Point,4326);
    END IF;
END $$;

-- Tabela property_owners
CREATE TABLE IF NOT EXISTS property_owners (
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    ownership_pct numeric(5,2),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (property_id, contact_id)
);

-- Tabela property_media
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

-- Tabela listings
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

-- Tabela visits
CREATE TABLE IF NOT EXISTS visits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    scheduled_for timestamptz NOT NULL,
    status visit_status DEFAULT 'scheduled',
    feedback text,
    agent_id uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela offers
CREATE TABLE IF NOT EXISTS offers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    buyer_contact_id uuid NOT NULL REFERENCES contacts(id),
    type text NOT NULL CHECK (type IN ('sale','rent')),
    amount numeric(14,2) NOT NULL,
    currency text DEFAULT 'BRL',
    expires_at date,
    status text CHECK (status IN ('submitted','accepted','rejected','withdrawn')) DEFAULT 'submitted',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela contracts
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

-- Tabela commissions
CREATE TABLE IF NOT EXISTS commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES auth.users(id),
    percentage numeric(5,2),
    amount numeric(14,2),
    status text CHECK (status IN ('pending','approved','paid')) DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela invoices
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    amount numeric(14,2) NOT NULL,
    currency text DEFAULT 'BRL',
    due_date date,
    status invoice_status DEFAULT 'open',
    external_ref text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela activities
CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('call','meeting','task','note','email','whatsapp','followup')),
    title text NOT NULL,
    description text,
    due_at timestamptz,
    completed_at timestamptz,
    lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
    deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Tabela notes
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

-- Tabela webhooks
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

-- Tabela api_keys
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

-- Tabela files
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

-- Tabela audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
    actor_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Triggers para updated_at
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT IN ('audit_logs', 'property_owners')
        AND table_name NOT LIKE '%_v'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'set_updated_at_' || t
        ) THEN
            EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
        END IF;
    END LOOP;
END $$;

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, username)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    END IF;
END $$;

-- Trigger para search em properties
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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_property_search_trigger') THEN
        CREATE TRIGGER update_property_search_trigger
        BEFORE INSERT OR UPDATE ON properties
        FOR EACH ROW EXECUTE FUNCTION update_property_search();
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN(search);
CREATE INDEX IF NOT EXISTS idx_properties_agency_status ON properties(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_type_city ON properties(type, city, state);
CREATE INDEX IF NOT EXISTS idx_leads_agency_status ON leads(agency_id, status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_agency_status ON deals(agency_id, status, stage_id);
CREATE INDEX IF NOT EXISTS idx_listings_agency_status ON listings(agency_id, status, channel);
CREATE INDEX IF NOT EXISTS idx_visits_agency_status ON visits(agency_id, status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_invoices_agency_status ON invoices(agency_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_activities_agency_id ON activities(agency_id, type, due_at);

-- Índice geoespacial se postgis disponível
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);
    END IF;
END $$;

-- RLS - Ativar em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
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

-- Políticas RLS para profiles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_policy') THEN
        CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_policy') THEN
        CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Políticas RLS para agencies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'agencies_select_policy') THEN
        CREATE POLICY agencies_select_policy ON agencies FOR SELECT 
        USING (has_agency_access(id) OR is_agency_admin(id) OR is_admin_global(auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agencies' AND policyname = 'agencies_update_policy') THEN
        CREATE POLICY agencies_update_policy ON agencies FOR UPDATE 
        USING (has_agency_write_access(id) OR is_agency_admin(id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

-- Macro para criar políticas RLS padrão para tabelas com agency_id
DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY['contacts','leads','pipelines','pipeline_stages','deals','properties','property_owners','property_media','listings','visits','offers','contracts','commissions','invoices','activities','notes','webhooks','api_keys','files'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- SELECT policy
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_select_policy') THEN
            EXECUTE format('CREATE POLICY %I_select_policy ON %I FOR SELECT USING (has_agency_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()))', t, t);
        END IF;
        -- INSERT policy
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_insert_policy') THEN
            EXECUTE format('CREATE POLICY %I_insert_policy ON %I FOR INSERT WITH CHECK (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()))', t, t);
        END IF;
        -- UPDATE policy
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_update_policy') THEN
            EXECUTE format('CREATE POLICY %I_update_policy ON %I FOR UPDATE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()))', t, t);
        END IF;
        -- DELETE policy
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = t || '_delete_policy') THEN
            EXECUTE format('CREATE POLICY %I_delete_policy ON %I FOR DELETE USING (has_agency_write_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()))', t, t);
        END IF;
    END LOOP;
END $$;

-- Políticas especiais para app_roles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_roles' AND policyname = 'app_roles_select_policy') THEN
        CREATE POLICY app_roles_select_policy ON app_roles FOR SELECT 
        USING (user_id = auth.uid() OR (agency_id IS NOT NULL AND is_agency_admin(agency_id)) OR is_admin_global(auth.uid()));
    END IF;
END $$;

-- Políticas especiais para agency_members
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agency_members' AND policyname = 'agency_members_select_policy') THEN
        CREATE POLICY agency_members_select_policy ON agency_members FOR SELECT 
        USING (has_agency_access(agency_id) OR is_agency_admin(agency_id) OR is_admin_global(auth.uid()));
    END IF;
END $$;

-- Políticas especiais para audit_logs
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_select_policy') THEN
        CREATE POLICY audit_logs_select_policy ON audit_logs FOR SELECT 
        USING ((agency_id IS NOT NULL AND is_agency_admin(agency_id)) OR is_admin_global(auth.uid()));
    END IF;
END $$;

-- View pública para listings
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
    (SELECT pm.bucket || '/' || pm.path FROM property_media pm WHERE pm.property_id = p.id AND pm.kind = 'image' LIMIT 1) as cover_url
FROM properties p
INNER JOIN listings l ON l.property_id = p.id
WHERE l.status = 'published' AND p.status = 'available';

-- View para dashboard de agentes
CREATE OR REPLACE VIEW agent_dashboard_v AS
SELECT 
    l.agency_id,
    l.assigned_to as agent_id,
    COUNT(l.id) FILTER (WHERE l.created_at >= date_trunc('month', CURRENT_DATE)) as leads_this_month,
    COUNT(d.id) FILTER (WHERE d.created_at >= date_trunc('month', CURRENT_DATE)) as deals_this_month,
    COUNT(v.id) FILTER (WHERE v.created_at >= date_trunc('month', CURRENT_DATE)) as visits_this_month,
    COALESCE(SUM(d.value) FILTER (WHERE d.status = 'closed_won' AND d.created_at >= date_trunc('month', CURRENT_DATE)), 0) as revenue_this_month
FROM leads l
LEFT JOIN deals d ON d.lead_id = l.id
LEFT JOIN visits v ON v.lead_id = l.id
WHERE l.assigned_to IS NOT NULL
GROUP BY l.agency_id, l.assigned_to;

-- Seeds para pipelines padrão
INSERT INTO pipelines (id, agency_id, name, is_default) 
SELECT gen_random_uuid(), a.id, 'Atria Padrão', true
FROM agencies a
WHERE NOT EXISTS (SELECT 1 FROM pipelines p WHERE p.agency_id = a.id AND p.is_default = true)
ON CONFLICT DO NOTHING;

-- Seeds para stages padrão
WITH default_pipelines AS (
    SELECT id, agency_id FROM pipelines WHERE name = 'Atria Padrão' AND is_default = true
),
stages_data AS (
    SELECT * FROM (VALUES 
        ('Novo', 1),
        ('Contato', 2),
        ('Qualificado', 3),
        ('Proposta', 4),
        ('Fechamento', 5)
    ) AS t(stage_name, pos)
)
INSERT INTO pipeline_stages (pipeline_id, name, position)
SELECT dp.id, sd.stage_name, sd.pos
FROM default_pipelines dp
CROSS JOIN stages_data sd
WHERE NOT EXISTS (
    SELECT 1 FROM pipeline_stages ps 
    WHERE ps.pipeline_id = dp.id AND ps.name = sd.stage_name
)
ON CONFLICT DO NOTHING;

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grants específicos para views
GRANT SELECT ON public_listings_v TO anon, authenticated;
GRANT SELECT ON agent_dashboard_v TO authenticated;
