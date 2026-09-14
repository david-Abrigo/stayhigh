-- ==============================================================================
-- STAYHIGH: VINCULACIÓN DE COMERCIANTES A SUPABASE AUTH (auth.users)
-- ==============================================================================
-- Este script agrega la columna user_id en las tablas principales para que
-- cada vendedor tenga su cuenta propia por correo y recupere sus configuraciones.
-- ==============================================================================

-- 1. Agregar user_id a merchant_config
ALTER TABLE public.merchant_config 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_merchant_config_user_id ON public.merchant_config(user_id);

-- 2. Agregar user_id y user_email a devices
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS user_email text;

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);

-- 3. Agregar user_id a payment_links
ALTER TABLE public.payment_links 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_links_user_id ON public.payment_links(user_id);

-- 4. Agregar user_id a links_time si la tabla existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'links_time') THEN
        ALTER TABLE public.links_time ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_links_time_user_id ON public.links_time(user_id);
        GRANT SELECT, INSERT, UPDATE ON public.links_time TO anon, authenticated;
    END IF;
END $$;

-- 5. Asegurar permisos RLS en tablas para lectura y escritura
GRANT SELECT, INSERT, UPDATE ON public.merchant_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.devices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payment_links TO anon, authenticated;

-- Notificación de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Migración de Supabase Auth completada con éxito. Columnas user_id agregadas.';
END $$;
