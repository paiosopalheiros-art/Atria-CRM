-- Creating idempotent script to fix RLS policies without conflicts
-- Fix RLS policies for commissions table (idempotent)

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own commissions" ON commissions;
DROP POLICY IF EXISTS "Users can insert their own commissions" ON commissions;
DROP POLICY IF EXISTS "Users can update their own commissions" ON commissions;

-- Recreate policies
CREATE POLICY "Users can view their own commissions" ON commissions
    FOR SELECT USING (
        auth.uid() = captador_id OR 
        auth.uid() = vendedor_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can insert their own commissions" ON commissions
    FOR INSERT WITH CHECK (
        auth.uid() = captador_id OR 
        auth.uid() = vendedor_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Users can update their own commissions" ON commissions
    FOR UPDATE USING (
        auth.uid() = captador_id OR 
        auth.uid() = vendedor_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_type = 'admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Fix any missing policies for other tables
DROP POLICY IF EXISTS "Users can view publications" ON publications;
CREATE POLICY "Users can view publications" ON publications
    FOR SELECT USING (status = 'approved' OR auth.uid() = captor_id);

DROP POLICY IF EXISTS "Users can insert publications" ON publications;  
CREATE POLICY "Users can insert publications" ON publications
    FOR INSERT WITH CHECK (auth.uid() = captor_id);

ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Fix deals table policies
DROP POLICY IF EXISTS "Users can view their deals" ON deals;
CREATE POLICY "Users can view their deals" ON deals
    FOR SELECT USING (
        auth.uid() = seller_id OR 
        auth.uid() = captor_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can insert deals" ON deals;
CREATE POLICY "Users can insert deals" ON deals
    FOR INSERT WITH CHECK (
        auth.uid() = seller_id OR 
        auth.uid() = captor_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND user_type = 'admin'
        )
    );

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
