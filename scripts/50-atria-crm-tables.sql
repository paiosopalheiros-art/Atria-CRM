-- Átria CRM Imobiliário - Database Schema
-- Tabelas para feed unificado de imóveis internos e CRECI

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- 1) Properties (imóveis normalizados)
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('atriacrowd','creci')),
  external_id text,
  title text NOT NULL,
  display_title text,
  description text,
  price numeric,
  currency text DEFAULT 'BRL',
  city text,
  neighborhood text,
  address text,
  bedrooms int,
  bathrooms int,
  area numeric,
  parking int,
  images text[] DEFAULT '{}',
  url_source text,
  agency_id uuid,
  owner_profile_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (source, external_id)
);

-- 2) Properties Raw (dump bruto para auditoria)
CREATE TABLE IF NOT EXISTS properties_raw (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  external_id text,
  raw jsonb NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

-- 3) Sync Logs (telemetria do import)
CREATE TABLE IF NOT EXISTS sync_logs (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  fetched int NOT NULL,
  upserted int NOT NULL,
  since text,
  page int,
  ok boolean DEFAULT true,
  error_msg text,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy leitura pública de ativos
DROP POLICY IF EXISTS "Public read active properties" ON properties;
CREATE POLICY "Public read active properties" ON properties
  FOR SELECT USING (is_active = true);

-- Policy admin full access (placeholder - ajustar conforme auth)
DROP POLICY IF EXISTS "Admin full access" ON properties;
CREATE POLICY "Admin full access" ON properties
  FOR ALL USING (true); -- Simplificado por enquanto

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_updated ON properties(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Dados seed para desenvolvimento
INSERT INTO properties (source, title, display_title, description, price, city, neighborhood, bedrooms, bathrooms, area, parking, images) VALUES
('atriacrowd', 'Apartamento 3 quartos Copacabana', 'Apartamento 3 quartos Copacabana', 'Lindo apartamento com vista para o mar', 850000, 'Rio de Janeiro', 'Copacabana', 3, 2, 120, 1, '{"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"}'),
('atriacrowd', 'Casa 4 quartos Barra da Tijuca', 'Casa 4 quartos Barra da Tijuca', 'Casa espaçosa em condomínio fechado', 1200000, 'Rio de Janeiro', 'Barra da Tijuca', 4, 3, 200, 2, '{"https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"}'),
('creci', 'Casa Duplex Ipanema', 'CRECI • Ipanema • 3q / 150m²', 'Casa duplex próxima à praia', 2500000, 'Rio de Janeiro', 'Ipanema', 3, 2, 150, 1, '{"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}', 'https://creci.example.com/imovel/123'),
('creci', 'Apartamento Leblon', 'CRECI • Leblon • 2q / 80m²', 'Apartamento moderno no Leblon', 1800000, 'Rio de Janeiro', 'Leblon', 2, 1, 80, 1, '{"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"}', 'https://creci.example.com/imovel/456')
ON CONFLICT (source, external_id) DO NOTHING;
