-- Create essential tables to fix "table not found" errors
-- Simplified version without PL/pgSQL blocks

-- Create agencies table first (required for foreign keys)
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2),
    property_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'available',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL(10,2),
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id),
    agency_id UUID REFERENCES public.agencies(id),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    proposed_price DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    agency_id UUID REFERENCES public.agencies(id),
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    agency_id UUID REFERENCES public.agencies(id),
    action VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    agency_id UUID REFERENCES public.agencies(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id),
    agency_id UUID REFERENCES public.agencies(id),
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    contract_value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'draft',
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
DROP POLICY IF EXISTS "Allow all operations" ON public.agencies;
CREATE POLICY "Allow all operations" ON public.agencies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.properties;
CREATE POLICY "Allow all operations" ON public.properties FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.proposals;
CREATE POLICY "Allow all operations" ON public.proposals FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.invite_codes;
CREATE POLICY "Allow all operations" ON public.invite_codes FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.activity_logs;
CREATE POLICY "Allow all operations" ON public.activity_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.notifications;
CREATE POLICY "Allow all operations" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON public.contracts;
CREATE POLICY "Allow all operations" ON public.contracts FOR ALL USING (true);

-- Insert default agency
INSERT INTO public.agencies (name, email, phone, address) 
VALUES ('Atria Imobiliária', 'admin@atria.com', '(11) 99999-9999', 'São Paulo, SP')
ON CONFLICT (name) DO NOTHING;

-- Add agency_id column to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON public.properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_proposals_property_id ON public.proposals(property_id);
CREATE INDEX IF NOT EXISTS idx_proposals_agency_id ON public.proposals(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON public.contracts(property_id);
</sql>
