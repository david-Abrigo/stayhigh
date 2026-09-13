-- ==============================================================================
-- TABLA: payment_links
-- Permite que la app móvil cree enlaces de pago individuales ilimitados,
-- cada uno con su propio código corto, monto, concepto y mensajes personalizados.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,                       -- Código corto único (ej: "k8m2p9" o "LNK-7X9")
    device_id UUID,                                  -- ID del dispositivo/vendedor
    amount NUMERIC(10, 2),                          -- Monto fijo (o NULL si el cliente digita el monto)
    currency TEXT NOT NULL DEFAULT 'PEN',            -- PEN (Soles)
    concept TEXT,                                    -- Concepto / Detalle del pedido (ej: "1 Hamburguesa Royal + Papas")
    seller_message TEXT,                             -- Aviso o mensaje del vendedor al abrir el checkout
    confirmation_message TEXT,                       -- Mensaje post-venta en el comprobante digital
    status TEXT NOT NULL DEFAULT 'ACTIVE',           -- 'ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED'
    is_single_use BOOLEAN NOT NULL DEFAULT FALSE,    -- Si es de un solo uso o reutilizable
    views_count INTEGER NOT NULL DEFAULT 0,          -- Contador de visitas
    expires_at TIMESTAMPTZ,                          -- Fecha límite de caducidad (opcional)
    metadata JSONB DEFAULT '{}'::jsonb,              -- Metadatos adicionales
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payment_links_code ON payment_links(code);
CREATE INDEX IF NOT EXISTS idx_payment_links_device_id ON payment_links(device_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON payment_links(status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad permisivas para anon (App Móvil y Web)
DROP POLICY IF EXISTS "Allow anon select payment_links" ON payment_links;
CREATE POLICY "Allow anon select payment_links"
    ON payment_links FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert payment_links" ON payment_links;
CREATE POLICY "Allow anon insert payment_links"
    ON payment_links FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update payment_links" ON payment_links;
CREATE POLICY "Allow anon update payment_links"
    ON payment_links FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Agregar payment_link_id opcional a precharges si no existe
ALTER TABLE precharges ADD COLUMN IF NOT EXISTS payment_link_id UUID REFERENCES payment_links(id) ON DELETE SET NULL;
