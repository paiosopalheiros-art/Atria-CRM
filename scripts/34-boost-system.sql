-- Sistema de Boost para Imóveis
-- Permite destacar propriedades no feed com diferentes níveis de boost

-- Tabela de tipos de boost
CREATE TABLE IF NOT EXISTS boost_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  multiplier DECIMAL(3,2) NOT NULL, -- Multiplicador para o algoritmo (1.5x, 2.0x, 3.0x)
  price DECIMAL(10,2) NOT NULL, -- Preço em reais
  duration_days INTEGER NOT NULL, -- Duração em dias
  color VARCHAR(7) NOT NULL, -- Cor hex para UI
  icon VARCHAR(50) NOT NULL, -- Ícone para UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos de boost padrão
INSERT INTO boost_types (name, description, multiplier, price, duration_days, color, icon) VALUES
('Básico', 'Destaque simples por 7 dias', 1.5, 29.90, 7, '#3B82F6', 'Zap'),
('Premium', 'Destaque médio por 15 dias', 2.0, 59.90, 15, '#8B5CF6', 'Star'),
('Super', 'Destaque máximo por 30 dias', 3.0, 99.90, 30, '#F59E0B', 'Crown');

-- Tabela de boosts ativos
CREATE TABLE IF NOT EXISTS property_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  boost_type_id UUID NOT NULL REFERENCES boost_types(id),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para calcular score de boost
CREATE OR REPLACE FUNCTION calculate_boost_score(
  property_id UUID,
  base_score DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
DECLARE
  boost_multiplier DECIMAL := 1.0;
  days_remaining INTEGER := 0;
  time_decay DECIMAL := 1.0;
BEGIN
  -- Buscar boost ativo mais alto para a propriedade
  SELECT 
    bt.multiplier,
    EXTRACT(DAY FROM (pb.expires_at - NOW()))
  INTO boost_multiplier, days_remaining
  FROM property_boosts pb
  JOIN boost_types bt ON pb.boost_type_id = bt.id
  WHERE pb.property_id = calculate_boost_score.property_id
    AND pb.is_active = true
    AND pb.expires_at > NOW()
    AND pb.payment_status = 'paid'
  ORDER BY bt.multiplier DESC
  LIMIT 1;
  
  -- Se não há boost ativo, retornar score base
  IF boost_multiplier IS NULL THEN
    RETURN base_score;
  END IF;
  
  -- Calcular decay baseado no tempo restante (menos decay = mais destaque)
  time_decay := GREATEST(0.5, 1.0 - (days_remaining::DECIMAL / 30.0) * 0.3);
  
  -- Retornar score final
  RETURN base_score * boost_multiplier * time_decay;
END;
$$ LANGUAGE plpgsql;

-- View para propriedades com boost score
CREATE OR REPLACE VIEW properties_with_boost AS
SELECT 
  p.*,
  calculate_boost_score(p.id) as boost_score,
  pb.boost_type_id,
  bt.name as boost_name,
  bt.color as boost_color,
  bt.icon as boost_icon,
  pb.expires_at as boost_expires_at,
  CASE 
    WHEN pb.expires_at > NOW() AND pb.is_active = true AND pb.payment_status = 'paid' 
    THEN true 
    ELSE false 
  END as has_active_boost
FROM properties p
LEFT JOIN property_boosts pb ON p.id = pb.property_id 
  AND pb.is_active = true 
  AND pb.expires_at > NOW()
  AND pb.payment_status = 'paid'
LEFT JOIN boost_types bt ON pb.boost_type_id = bt.id
ORDER BY boost_score DESC, p.created_at DESC;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_property_boosts_property_id ON property_boosts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_boosts_expires_at ON property_boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_property_boosts_active ON property_boosts(is_active, payment_status);

-- RLS Policies
ALTER TABLE boost_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_boosts ENABLE ROW LEVEL SECURITY;

-- Políticas para boost_types (todos podem ver)
CREATE POLICY "boost_types_select" ON boost_types FOR SELECT USING (true);

-- Políticas para property_boosts (apenas da mesma agência)
CREATE POLICY "property_boosts_select" ON property_boosts FOR SELECT 
USING (agency_id IN (
  SELECT agency_id FROM user_profiles WHERE id = auth.uid()
));

CREATE POLICY "property_boosts_insert" ON property_boosts FOR INSERT 
WITH CHECK (agency_id IN (
  SELECT agency_id FROM user_profiles WHERE id = auth.uid()
));

CREATE POLICY "property_boosts_update" ON property_boosts FOR UPDATE 
USING (agency_id IN (
  SELECT agency_id FROM user_profiles WHERE id = auth.uid()
));
