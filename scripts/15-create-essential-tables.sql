-- Essential tables for CRM Atria to resolve immediate errors
-- This script creates the core tables needed for the admin dashboard to function

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create agencies table (required for multi-tenancy)
CREATE TABLE IF NOT EXISTS public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(50) NOT NULL DEFAULT 'residential',
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'sale',
    price DECIMAL(15,2),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20),
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    area_sqm DECIMAL(10,2),
    parking_spaces INTEGER DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'available',
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    contract_type VARCHAR(50) NOT NULL DEFAULT 'sale',
    value DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    commission_value DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'draft',
    signed_date DATE,
    closing_date DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposals table
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    proposed_value DECIMAL(15,2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    response_message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS public.invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'partner',
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agencies
CREATE POLICY "Users can view their own agency" ON public.agencies
    FOR SELECT USING (
        id IN (
            SELECT agency_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for properties
CREATE POLICY "Users can view properties from their agency" ON public.properties
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for contracts
CREATE POLICY "Users can view contracts from their agency" ON public.contracts
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for proposals
CREATE POLICY "Users can view proposals from their agency" ON public.proposals
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for invite_codes
CREATE POLICY "Users can view invite codes from their agency" ON public.invite_codes
    FOR ALL USING (
        agency_id IN (
            SELECT agency_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for activity_logs
CREATE POLICY "Users can view activity logs from their agency" ON public.activity_logs
    FOR SELECT USING (
        agency_id IN (
            SELECT agency_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_agency_id ON public.properties(agency_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON public.contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_proposals_agency_id ON public.proposals(agency_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_agency_id ON public.activity_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Add agency_id to user_profiles if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES public.agencies(id);

-- Create a default agency for existing users
INSERT INTO public.agencies (id, name, email, phone, address, city, state)
VALUES (
    gen_random_uuid(),
    'Atria Imobiliária',
    'admin@atria.com',
    '(11) 99999-9999',
    'Rua Principal, 123',
    'São Paulo',
    'SP'
) ON CONFLICT (email) DO NOTHING;

-- Update user_profiles to link to the default agency
UPDATE public.user_profiles 
SET agency_id = (SELECT id FROM public.agencies WHERE email = 'admin@atria.com' LIMIT 1)
WHERE agency_id IS NULL;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invite_codes_updated_at BEFORE UPDATE ON public.invite_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
