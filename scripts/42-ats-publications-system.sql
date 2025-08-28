-- ATS Publications System with 10/40/50 commission split
-- Publicações (imóveis) da plataforma
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'manual',           -- 'creci' | 'manual' | 'ats'
  source_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'BRL',
  city TEXT,
  state TEXT,
  neighborhood TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_m2 NUMERIC,
  image_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'review',           -- 'draft' | 'review' | 'published' | 'archived'
  captor_id UUID REFERENCES auth.users(id),       -- quem cadastrou/captou (opcional no import)
  credits_cost INTEGER NOT NULL DEFAULT 1,        -- ATS = 3 créditos, manual = 1 crédito
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_publications_status ON public.publications(status);
CREATE INDEX IF NOT EXISTS idx_publications_source ON public.publications(source);
CREATE INDEX IF NOT EXISTS idx_publications_captor ON public.publications(captor_id);

-- Vendas/negócios fechados com nova regra 10/40/50
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id),     -- quem vendeu
  captor_id UUID REFERENCES auth.users(id),              -- quem captou (pode ser null)
  gross_value NUMERIC NOT NULL,                          -- valor base para calcular comissão
  commission_value NUMERIC NOT NULL,                     -- comissão total a distribuir
  platform_cut NUMERIC NOT NULL,                         -- 10% de commission_value
  captor_cut NUMERIC NOT NULL,                           -- 40% (ou 0 se sem captador)
  seller_cut NUMERIC NOT NULL,                           -- 50% (ou 60% se sem captador)
  status TEXT NOT NULL DEFAULT 'pending',                -- 'pending' | 'paid' | 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Índices para deals
CREATE INDEX IF NOT EXISTS idx_deals_publication ON public.deals(publication_id);
CREATE INDEX IF NOT EXISTS idx_deals_seller ON public.deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_deals_captor ON public.deals(captor_id);

-- View para feed público (apenas publicações aprovadas)
CREATE OR REPLACE VIEW public.feed_published AS
SELECT 
  p.*,
  u.email as captor_email,
  CASE 
    WHEN p.source = 'ats' OR p.source = 'creci' THEN 'ATS'
    ELSE 'PARCEIRO'
  END as source_type
FROM public.publications p
LEFT JOIN auth.users u ON p.captor_id = u.id
WHERE p.status = 'published'
ORDER BY p.updated_at DESC;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_publications_updated_at 
    BEFORE UPDATE ON public.publications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (básicas)
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Política para leitura de publicações (todos podem ver publicadas)
CREATE POLICY "Anyone can view published publications" ON public.publications
    FOR SELECT USING (status = 'published');

-- Política para admins verem todas as publicações
CREATE POLICY "Admins can view all publications" ON public.publications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

-- Política para deals (apenas envolvidos podem ver)
CREATE POLICY "Users can view their own deals" ON public.deals
    FOR SELECT USING (
        seller_id = auth.uid() OR 
        captor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND user_type = 'admin'
        )
    );

COMMENT ON TABLE public.publications IS 'Publicações de imóveis da plataforma - ATS gasta 3 créditos, manual gasta 1';
COMMENT ON TABLE public.deals IS 'Vendas fechadas com comissão 10% plataforma / 40% captador / 50% vendedor';
COMMENT ON VIEW public.feed_published IS 'Feed público de publicações aprovadas';
