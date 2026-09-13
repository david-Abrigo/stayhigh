-- ==============================================================================
-- MIGRACIÓN SUPABASE: TABLA links_time Y EXTENSIÓN DE TEMPORIZADORES
-- Permite configurar y programar desde la app móvil Android:
-- 1. Temporizador Maestro del Enlace (link_timeout_minutes)
-- 2. Temporizador de Pantalla QR (qr_timeout_minutes, mínimo 10 min)
-- 3. Tiempo de Retención en Memoria (session_timeout_minutes, 20 min)
-- ==============================================================================

-- 1. CREAR LA TABLA links_time
CREATE TABLE IF NOT EXISTS links_time (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    link_code TEXT,                                            -- NULL para configuración general del comercio, o código específico (ej: 'vpb3t9')
    link_timeout_minutes INTEGER NOT NULL DEFAULT 60 CHECK (link_timeout_minutes >= 0),  -- 0 = sin límite de expiración
    qr_timeout_minutes INTEGER NOT NULL DEFAULT 15 CHECK (qr_timeout_minutes >= 10),     -- Mínimo 10 minutos por seguridad
    session_timeout_minutes INTEGER NOT NULL DEFAULT 20 CHECK (session_timeout_minutes >= 5), -- Memoria de sesión local (default 20 min)
    auto_renew_qr BOOLEAN NOT NULL DEFAULT TRUE,               -- Permitir al comprador regenerar QR si vence
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar búsquedas ultra-rápidas en el checkout
CREATE INDEX IF NOT EXISTS idx_links_time_device ON links_time(device_id);
CREATE INDEX IF NOT EXISTS idx_links_time_link_code ON links_time(link_code);

-- Restricción de unicidad:
-- Un solo registro por enlace específico (device_id, link_code)
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_time_unique_link 
    ON links_time(device_id, link_code) 
    WHERE link_code IS NOT NULL;

-- Un solo registro global por dispositivo/tienda (cuando link_code es NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_links_time_unique_device_default 
    ON links_time(device_id) 
    WHERE link_code IS NULL;

-- 2. POLÍTICAS DE SEGURIDAD RLS (Para App Android y Web con clave anon)
ALTER TABLE links_time ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon select links_time" ON links_time;
CREATE POLICY "Allow anon select links_time"
    ON links_time FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert links_time" ON links_time;
CREATE POLICY "Allow anon insert links_time"
    ON links_time FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update links_time" ON links_time;
CREATE POLICY "Allow anon update links_time"
    ON links_time FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete links_time" ON links_time;
CREATE POLICY "Allow anon delete links_time"
    ON links_time FOR DELETE TO anon USING (true);

-- 3. EXTENDER TABLA payment_links CON COLUMNAS DE TEMPORIZADORES DIRECTAS
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS qr_timeout_minutes INTEGER DEFAULT 15;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS link_timeout_minutes INTEGER DEFAULT 60;

-- 4. EXTENDER TABLA merchant_config CON COLUMNAS DE TEMPORIZADORES GENERALES
ALTER TABLE merchant_config ADD COLUMN IF NOT EXISTS qr_timeout_minutes INTEGER DEFAULT 15;
ALTER TABLE merchant_config ADD COLUMN IF NOT EXISTS link_timeout_minutes INTEGER DEFAULT 60;
ALTER TABLE merchant_config ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 20;

-- 5. TRIGGER PARA AUTO-ACTUALIZAR updated_at EN links_time
CREATE OR REPLACE FUNCTION set_links_time_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_links_time_updated_at ON links_time;
CREATE TRIGGER trg_links_time_updated_at
    BEFORE UPDATE ON links_time
    FOR EACH ROW
    EXECUTE FUNCTION set_links_time_updated_at();

-- 6. INICIALIZAR REGISTROS PREDETERMINADOS PARA DISPOSITIVOS EXISTENTES
INSERT INTO links_time (device_id, link_code, link_timeout_minutes, qr_timeout_minutes, session_timeout_minutes)
SELECT id, NULL, 60, 15, 20 FROM devices
ON CONFLICT DO NOTHING;

-- Notificar recarga de schema cache en Supabase PostgREST
NOTIFY pgrst, 'reload schema';
