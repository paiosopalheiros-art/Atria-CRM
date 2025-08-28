-- Creating optimized indexes for better query performance

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || email));

-- Properties table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status ON properties(approval_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_deleted_at ON properties(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location ON properties(city, state);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_search ON properties USING gin(to_tsvector('english', title || ' ' || description));

-- Contracts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_property_id ON contracts(property_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_partner_id ON contracts(partner_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_deleted_at ON contracts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_users ON contracts(creator_id, partner_id);

-- Notifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Contract requests table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_requests_property_id ON contract_requests(property_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_requests_requester_id ON contract_requests(requester_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_requests_status ON contract_requests(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_requests_created_at ON contract_requests(created_at DESC);

-- Repayments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repayments_contract_id ON repayments(contract_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repayments_user_id ON repayments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repayments_status ON repayments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repayments_due_date ON repayments(due_date);

-- Invite codes table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_codes_user_type ON invite_codes(user_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invite_codes_is_used ON invite_codes(is_used);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_user_status ON properties(user_id, approval_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_property_status ON contracts(property_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_type_read ON notifications(user_id, type, is_read);

-- Analyze tables for better query planning
ANALYZE users;
ANALYZE properties;
ANALYZE contracts;
ANALYZE notifications;
ANALYZE contract_requests;
ANALYZE repayments;
ANALYZE invite_codes;
