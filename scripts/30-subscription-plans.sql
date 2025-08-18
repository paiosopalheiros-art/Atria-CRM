-- Creating subscription plans system with Free, Pro, Elite tiers
-- Tabela de planos disponíveis
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_properties INTEGER,
  max_leads INTEGER,
  max_contracts INTEGER,
  max_team_members INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, max_properties, max_leads, max_contracts, max_team_members, features) VALUES
('free', 'Free', 0, 0, 5, 10, 2, 1, '["basic_dashboard", "property_listing", "lead_management"]'),
('pro', 'Pro', 49.90, 499.00, 50, 100, 20, 5, '["advanced_dashboard", "analytics", "ai_assistant", "gamification", "priority_support"]'),
('elite', 'Elite', 99.90, 999.00, NULL, NULL, NULL, 20, '["unlimited_everything", "custom_branding", "api_access", "dedicated_support", "advanced_integrations"]');

-- Adicionar campo de plano aos usuários
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id) DEFAULT (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Tabela de histórico de assinaturas
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL, -- active, cancelled, expired, pending
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10,2),
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan ON user_profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_status ON subscription_history(status);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Políticas para planos (todos podem ver)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- Políticas para histórico (usuários só veem o próprio)
CREATE POLICY "Users can view own subscription history" ON subscription_history FOR SELECT USING (
  user_id IN (
    SELECT user_id FROM user_profiles WHERE user_id = auth.uid()
  )
);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all subscription history" ON subscription_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND user_type = 'admin'
  )
);
