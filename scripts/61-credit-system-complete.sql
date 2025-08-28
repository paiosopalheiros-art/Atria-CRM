-- [CREDITOS] Complete Credit System Implementation
-- Create enums for property source and tier
DO $$ BEGIN
    CREATE TYPE property_source AS ENUM ('creci', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_tier AS ENUM ('baixo', 'medio', 'luxo');
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add columns to properties table if they don't exist
DO $$ BEGIN
    ALTER TABLE properties ADD COLUMN source property_source DEFAULT 'user';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE properties ADD COLUMN tier property_tier DEFAULT 'baixo';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create user_credit_balances table
CREATE TABLE IF NOT EXISTS user_credit_balances (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at timestamptz DEFAULT now()
);

-- Create credit_ledger table
CREATE TABLE IF NOT EXISTS credit_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delta integer NOT NULL,
    reason text NOT NULL,
    property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_created_at ON credit_ledger(created_at DESC);

-- Function to grant credits
CREATE OR REPLACE FUNCTION grant_credits(
    p_user_id uuid,
    p_amount integer,
    p_reason text DEFAULT 'grant'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert or update balance
    INSERT INTO user_credit_balances (user_id, balance, updated_at)
    VALUES (p_user_id, p_amount, now())
    ON CONFLICT (user_id)
    DO UPDATE SET 
        balance = user_credit_balances.balance + p_amount,
        updated_at = now();
    
    -- Add ledger entry
    INSERT INTO credit_ledger (user_id, delta, reason, created_at)
    VALUES (p_user_id, p_amount, p_reason, now());
END;
$$;

-- Function to spend credits atomically
CREATE OR REPLACE FUNCTION spend_credits(
    p_user_id uuid,
    p_amount integer,
    p_reason text,
    p_property_id uuid DEFAULT NULL,
    p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance integer;
BEGIN
    -- Lock and get current balance
    SELECT balance INTO current_balance
    FROM user_credit_balances
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- If no balance record exists, treat as 0
    IF current_balance IS NULL THEN
        current_balance := 0;
    END IF;
    
    -- Check if sufficient balance
    IF current_balance < p_amount THEN
        RETURN false;
    END IF;
    
    -- Deduct credits
    INSERT INTO user_credit_balances (user_id, balance, updated_at)
    VALUES (p_user_id, current_balance - p_amount, now())
    ON CONFLICT (user_id)
    DO UPDATE SET 
        balance = current_balance - p_amount,
        updated_at = now();
    
    -- Add ledger entry (negative delta for spending)
    INSERT INTO credit_ledger (user_id, delta, reason, property_id, meta, created_at)
    VALUES (p_user_id, -p_amount, p_reason, p_property_id, p_meta, now());
    
    RETURN true;
END;
$$;

-- RLS Policies
ALTER TABLE user_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Users can view own credit balance" ON user_credit_balances;
DROP POLICY IF EXISTS "Users can view own credit ledger" ON credit_ledger;

-- Users can only see their own balance
CREATE POLICY "Users can view own credit balance" ON user_credit_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own ledger entries
CREATE POLICY "Users can view own credit ledger" ON credit_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- No direct writes allowed - only through RPC functions
-- (No INSERT/UPDATE/DELETE policies = no direct writes)

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION grant_credits TO authenticated;
GRANT EXECUTE ON FUNCTION spend_credits TO authenticated;
