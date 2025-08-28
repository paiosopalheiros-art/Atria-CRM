-- Create invite codes table for user management
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'partner', 'captador')),
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires ON invite_codes(expires_at);

-- Insert default invite codes
INSERT INTO invite_codes (code, user_type, max_uses, expires_at) VALUES
('ADMIN2024', 'admin', 10, '2025-12-31 23:59:59'),
('PARTNER2024', 'partner', 100, '2025-12-31 23:59:59'),
('CAPTADOR2024', 'captador', 100, '2025-12-31 23:59:59')
ON CONFLICT (code) DO NOTHING;
