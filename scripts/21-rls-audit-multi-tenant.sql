-- RLS Audit Script - Multi-tenant isolation by agency_id
-- This script ensures complete isolation between agencies

-- Helper functions for agency access control
CREATE OR REPLACE FUNCTION has_agency_access(target_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND agency_id = target_agency_id
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_agency_write_access(target_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND agency_id = target_agency_id
    AND is_active = TRUE
    AND user_type IN ('admin', 'agent', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_agency_admin(target_agency_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND agency_id = target_agency_id
    AND is_active = TRUE
    AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_agency_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT agency_id FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND is_active = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add agency_id to tables that don't have it
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);
ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id);

-- Update existing records to have agency_id (one-time migration)
UPDATE contracts SET agency_id = (
  SELECT p.agency_id FROM properties p WHERE p.id = contracts.property_id
) WHERE agency_id IS NULL;

UPDATE proposals SET agency_id = (
  SELECT p.agency_id FROM properties p WHERE p.id = proposals.property_id
) WHERE agency_id IS NULL;

UPDATE activity_logs SET agency_id = (
  SELECT up.agency_id FROM user_profiles up WHERE up.user_id = activity_logs.user_id
) WHERE agency_id IS NULL;

UPDATE notifications SET agency_id = (
  SELECT up.agency_id FROM user_profiles up WHERE up.user_id = notifications.user_id
) WHERE agency_id IS NULL;

-- Make agency_id NOT NULL where appropriate
ALTER TABLE contracts ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE proposals ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE activity_logs ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE notifications ALTER COLUMN agency_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_agency_id ON contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_proposals_agency_id ON proposals(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_agency_id ON activity_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_agency_id ON invite_codes(agency_id);

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- AGENCIES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own agency" ON agencies;
CREATE POLICY "Users can view their own agency" ON agencies
  FOR SELECT USING (has_agency_access(id));

DROP POLICY IF EXISTS "Agency admins can update their agency" ON agencies;
CREATE POLICY "Agency admins can update their agency" ON agencies
  FOR UPDATE USING (is_agency_admin(id));

-- USER_PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view profiles from their agency" ON user_profiles;
CREATE POLICY "Users can view profiles from their agency" ON user_profiles
  FOR SELECT USING (has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Agency admins can manage profiles in their agency" ON user_profiles;
CREATE POLICY "Agency admins can manage profiles in their agency" ON user_profiles
  FOR ALL USING (is_agency_admin(agency_id));

-- PROPERTIES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view properties from their agency" ON properties;
CREATE POLICY "Users can view properties from their agency" ON properties
  FOR SELECT USING (has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can insert properties for their agency" ON properties;
CREATE POLICY "Users can insert properties for their agency" ON properties
  FOR INSERT WITH CHECK (has_agency_write_access(agency_id));

DROP POLICY IF EXISTS "Users can update properties from their agency" ON properties;
CREATE POLICY "Users can update properties from their agency" ON properties
  FOR UPDATE USING (has_agency_write_access(agency_id));

DROP POLICY IF EXISTS "Agency admins can delete properties from their agency" ON properties;
CREATE POLICY "Agency admins can delete properties from their agency" ON properties
  FOR DELETE USING (is_agency_admin(agency_id));

-- CONTRACTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view contracts from their agency" ON contracts;
CREATE POLICY "Users can view contracts from their agency" ON contracts
  FOR SELECT USING (has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can insert contracts for their agency" ON contracts;
CREATE POLICY "Users can insert contracts for their agency" ON contracts
  FOR INSERT WITH CHECK (has_agency_write_access(agency_id));

DROP POLICY IF EXISTS "Users can update contracts from their agency" ON contracts;
CREATE POLICY "Users can update contracts from their agency" ON contracts
  FOR UPDATE USING (has_agency_write_access(agency_id));

DROP POLICY IF EXISTS "Agency admins can delete contracts from their agency" ON contracts;
CREATE POLICY "Agency admins can delete contracts from their agency" ON contracts
  FOR DELETE USING (is_agency_admin(agency_id));

-- PROPOSALS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view proposals from their agency" ON proposals;
CREATE POLICY "Users can view proposals from their agency" ON proposals
  FOR SELECT USING (has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can insert proposals for their agency" ON proposals;
CREATE POLICY "Users can insert proposals for their agency" ON proposals
  FOR INSERT WITH CHECK (has_agency_write_access(agency_id));

DROP POLICY IF EXISTS "Users can update proposals from their agency" ON proposals;
CREATE POLICY "Users can update proposals from their agency" ON proposals
  FOR UPDATE USING (has_agency_write_access(agency_id));

DROP POLICY IF EXISTS "Agency admins can delete proposals from their agency" ON proposals;
CREATE POLICY "Agency admins can delete proposals from their agency" ON proposals
  FOR DELETE USING (is_agency_admin(agency_id));

-- ACTIVITY_LOGS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view activity logs from their agency" ON activity_logs;
CREATE POLICY "Users can view activity logs from their agency" ON activity_logs
  FOR SELECT USING (has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can insert activity logs for their agency" ON activity_logs;
CREATE POLICY "Users can insert activity logs for their agency" ON activity_logs
  FOR INSERT WITH CHECK (has_agency_access(agency_id));

-- NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view notifications from their agency" ON notifications;
CREATE POLICY "Users can view notifications from their agency" ON notifications
  FOR SELECT USING (has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid() AND has_agency_access(agency_id));

DROP POLICY IF EXISTS "Users can insert notifications for their agency" ON notifications;
CREATE POLICY "Users can insert notifications for their agency" ON notifications
  FOR INSERT WITH CHECK (has_agency_access(agency_id));

-- INVITE_CODES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view invite codes from their agency" ON invite_codes;
CREATE POLICY "Users can view invite codes from their agency" ON invite_codes
  FOR SELECT USING (agency_id IS NULL OR has_agency_access(agency_id));

DROP POLICY IF EXISTS "Agency admins can manage invite codes for their agency" ON invite_codes;
CREATE POLICY "Agency admins can manage invite codes for their agency" ON invite_codes
  FOR ALL USING (agency_id IS NULL OR is_agency_admin(agency_id));

-- Create triggers to automatically set agency_id on insert
CREATE OR REPLACE FUNCTION set_agency_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agency_id IS NULL THEN
    NEW.agency_id := get_user_agency_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS trigger_set_agency_id_activity_logs ON activity_logs;
CREATE TRIGGER trigger_set_agency_id_activity_logs
  BEFORE INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_agency_id_from_user();

DROP TRIGGER IF EXISTS trigger_set_agency_id_notifications ON notifications;
CREATE TRIGGER trigger_set_agency_id_notifications
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_agency_id_from_user();

-- Create function to validate property-contract agency consistency
CREATE OR REPLACE FUNCTION validate_property_agency_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- For contracts, ensure agency_id matches property's agency_id
  IF TG_TABLE_NAME = 'contracts' THEN
    IF NEW.property_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM properties 
        WHERE id = NEW.property_id 
        AND agency_id = NEW.agency_id
      ) THEN
        RAISE EXCEPTION 'Contract agency_id must match property agency_id';
      END IF;
    END IF;
  END IF;
  
  -- For proposals, ensure agency_id matches property's agency_id
  IF TG_TABLE_NAME = 'proposals' THEN
    IF NEW.property_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM properties 
        WHERE id = NEW.property_id 
        AND agency_id = NEW.agency_id
      ) THEN
        RAISE EXCEPTION 'Proposal agency_id must match property agency_id';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply consistency validation triggers
DROP TRIGGER IF EXISTS trigger_validate_contract_agency ON contracts;
CREATE TRIGGER trigger_validate_contract_agency
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION validate_property_agency_consistency();

DROP TRIGGER IF EXISTS trigger_validate_proposal_agency ON proposals;
CREATE TRIGGER trigger_validate_proposal_agency
  BEFORE INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION validate_property_agency_consistency();
