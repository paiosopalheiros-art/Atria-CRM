-- Sistema de Comissões - Regra 20/30/50
-- 20% para plataforma, 30% para captador, 50% para vendedor

-- Tabela para rastrear comissões
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  sale_price DECIMAL(15,2) NOT NULL,
  
  -- Usuários envolvidos
  captador_id UUID REFERENCES user_profiles(user_id),
  vendedor_id UUID REFERENCES user_profiles(user_id),
  
  -- Valores das comissões (20/30/50)
  platform_commission DECIMAL(15,2) NOT NULL, -- 20%
  captador_commission DECIMAL(15,2) NOT NULL, -- 30%
  vendedor_commission DECIMAL(15,2) NOT NULL, -- 50%
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Função para calcular comissões automaticamente
CREATE OR REPLACE FUNCTION calculate_commission(
  p_property_id UUID,
  p_sale_price DECIMAL,
  p_captador_id UUID,
  p_vendedor_id UUID
) RETURNS UUID AS $$
DECLARE
  commission_id UUID;
  platform_amount DECIMAL;
  captador_amount DECIMAL;
  vendedor_amount DECIMAL;
BEGIN
  -- Calcular valores (20/30/50)
  platform_amount := p_sale_price * 0.20;
  captador_amount := p_sale_price * 0.30;
  vendedor_amount := p_sale_price * 0.50;
  
  -- Se mesmo usuário capta e vende, ele recebe 80% (30% + 50%)
  IF p_captador_id = p_vendedor_id THEN
    captador_amount := p_sale_price * 0.80;
    vendedor_amount := 0;
  END IF;
  
  -- Inserir comissão
  INSERT INTO commissions (
    property_id, sale_price, captador_id, vendedor_id,
    platform_commission, captador_commission, vendedor_commission
  ) VALUES (
    p_property_id, p_sale_price, p_captador_id, p_vendedor_id,
    platform_amount, captador_amount, vendedor_amount
  ) RETURNING id INTO commission_id;
  
  RETURN commission_id;
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_commissions_captador ON commissions(captador_id);
CREATE INDEX IF NOT EXISTS idx_commissions_vendedor ON commissions(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

-- RLS Policies
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias comissões
CREATE POLICY "Users can view own commissions" ON commissions
  FOR SELECT USING (
    captador_id = auth.uid() OR 
    vendedor_id = auth.uid()
  );

-- Admins podem ver todas as comissões
CREATE POLICY "Admins can view all commissions" ON commissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_type = 'admin'
    )
  );
