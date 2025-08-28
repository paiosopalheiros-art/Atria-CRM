-- Creating missing commissions table and adding approval_status column to properties
-- Criar tabela de comissões
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    sale_price NUMERIC NOT NULL,
    captador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    platform_commission NUMERIC NOT NULL DEFAULT 0,
    captador_commission NUMERIC NOT NULL DEFAULT 0,
    vendedor_commission NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna approval_status na tabela properties se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' 
        AND column_name = 'approval_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.properties 
        ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
        
        -- Atualizar registros existentes para 'approved' por padrão
        UPDATE public.properties SET approval_status = 'approved' WHERE approval_status IS NULL;
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_commissions_captador_id ON public.commissions(captador_id);
CREATE INDEX IF NOT EXISTS idx_commissions_vendedor_id ON public.commissions(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_commissions_property_id ON public.commissions(property_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions(status);
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON public.properties(approval_status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas suas próprias comissões
CREATE POLICY "Users can view their own commissions" ON public.commissions
    FOR SELECT USING (
        auth.uid() = captador_id OR 
        auth.uid() = vendedor_id
    );

-- Política RLS: apenas admins podem inserir/atualizar comissões
CREATE POLICY "Only admins can manage commissions" ON public.commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Função para calcular comissões automaticamente (20% plataforma, 30% captador, 50% vendedor)
CREATE OR REPLACE FUNCTION calculate_commission_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular comissões baseado no preço de venda
    -- Assumindo comissão total de 6% sobre o valor da venda
    DECLARE
        total_commission NUMERIC := NEW.sale_price * 0.06;
    BEGIN
        NEW.platform_commission := total_commission * 0.20;  -- 20% para plataforma
        NEW.captador_commission := total_commission * 0.30;  -- 30% para captador
        NEW.vendedor_commission := total_commission * 0.50;  -- 50% para vendedor
        
        -- Se o mesmo usuário é captador e vendedor, ele recebe 80% (30% + 50%)
        IF NEW.captador_id = NEW.vendedor_id THEN
            NEW.captador_commission := total_commission * 0.80;  -- 80% para captador/vendedor
            NEW.vendedor_commission := 0;  -- Zerar comissão de vendedor
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular comissões automaticamente
CREATE TRIGGER trigger_calculate_commissions
    BEFORE INSERT OR UPDATE ON public.commissions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_commission_amounts();

-- Comentários para documentação
COMMENT ON TABLE public.commissions IS 'Tabela para gerenciar comissões de captação e vendas';
COMMENT ON COLUMN public.commissions.platform_commission IS 'Comissão da plataforma (20%)';
COMMENT ON COLUMN public.commissions.captador_commission IS 'Comissão do captador (30% ou 80% se também for vendedor)';
COMMENT ON COLUMN public.commissions.vendedor_commission IS 'Comissão do vendedor (50%)';
COMMENT ON COLUMN public.properties.approval_status IS 'Status de aprovação da propriedade (pending, approved, rejected)';
