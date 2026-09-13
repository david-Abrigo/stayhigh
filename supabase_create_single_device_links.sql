-- ==============================================================================
-- MIGRACIÓN SUPABASE: ENLACES EXCLUSIVOS PARA UN SOLO DISPOSITIVO / PERSONA
-- Compatible al 100% con tu esquema actual de payment_links.
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- ==============================================================================

-- 1. AGREGAR COLUMNAS DE PROTECCIÓN DE DISPOSITIVO A payment_links
ALTER TABLE public.payment_links 
  ADD COLUMN IF NOT EXISTS is_single_device BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locked_device_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS target_customer_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS device_user_agent TEXT DEFAULT NULL;

-- 2. ÍNDICES PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_payment_links_single_device 
  ON public.payment_links(is_single_device) 
  WHERE is_single_device = TRUE;

CREATE INDEX IF NOT EXISTS idx_payment_links_device_token 
  ON public.payment_links(locked_device_token) 
  WHERE locked_device_token IS NOT NULL;

-- 3. FUNCIÓN ATÓMICA DE VINCULACIÓN (bind_payment_link_device)
-- Garantiza atomicidad absoluta: solo un dispositivo gana la carrera en aperturas concurrentes.
CREATE OR REPLACE FUNCTION public.bind_payment_link_device(
    p_code TEXT,
    p_device_token TEXT,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_link RECORD;
    v_updated_id UUID;
BEGIN
    -- 1. Buscar el enlace de cobro por su código único
    SELECT id, code, is_single_device, locked_device_token, first_opened_at, status, is_single_use
    INTO v_link
    FROM public.payment_links
    WHERE code = p_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'LINK_NOT_FOUND'
        );
    END IF;

    -- 2. Validar si el enlace ya fue cancelado o expiró
    IF v_link.status = 'EXPIRED' OR v_link.status = 'CANCELLED' THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'LINK_INACTIVE',
            'status', v_link.status
        );
    END IF;

    -- 3. Validar si el enlace era de uso único y ya fue pagado
    IF v_link.is_single_use AND v_link.status = 'PAID' THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'ALREADY_PAID'
        );
    END IF;

    -- 4. Si el enlace NO tiene restricción de dispositivo único, permitir libre acceso
    IF v_link.is_single_device IS NOT TRUE THEN
        UPDATE public.payment_links
        SET views_count = views_count + 1,
            updated_at = now()
        WHERE code = p_code;

        RETURN jsonb_build_object(
            'success', true,
            'reason', 'NOT_RESTRICTED'
        );
    END IF;

    -- 5. Si ya fue abierto en otro dispositivo y el token no coincide: DENEGADO
    IF v_link.locked_device_token IS NOT NULL AND v_link.locked_device_token <> p_device_token THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'LOCKED_OTHER_DEVICE',
            'first_opened_at', v_link.first_opened_at
        );
    END IF;

    -- 6. Si es el mismo dispositivo que lo abrió originalmente: PERMITIDO
    IF v_link.locked_device_token = p_device_token THEN
        UPDATE public.payment_links
        SET views_count = views_count + 1,
            updated_at = now()
        WHERE code = p_code;

        RETURN jsonb_build_object(
            'success', true,
            'reason', 'SAME_DEVICE',
            'first_opened_at', v_link.first_opened_at
        );
    END IF;

    -- 7. Primera apertura: Vincular atómicamente al dispositivo actual
    UPDATE public.payment_links
    SET locked_device_token = p_device_token,
        first_opened_at = now(),
        device_user_agent = p_user_agent,
        views_count = views_count + 1,
        updated_at = now()
    WHERE code = p_code
      AND locked_device_token IS NULL
    RETURNING id INTO v_updated_id;

    IF v_updated_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'reason', 'BOUND_SUCCESS',
            'first_opened_at', now()
        );
    ELSE
        -- Manejo de condición de carrera si dos peticiones llegaron en el mismo milisegundo
        SELECT locked_device_token, first_opened_at INTO v_link
        FROM public.payment_links
        WHERE code = p_code;

        IF v_link.locked_device_token = p_device_token THEN
            RETURN jsonb_build_object(
                'success', true,
                'reason', 'SAME_DEVICE',
                'first_opened_at', v_link.first_opened_at
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'reason', 'LOCKED_OTHER_DEVICE',
                'first_opened_at', v_link.first_opened_at
            );
        END IF;
    END IF;
END;
$$;

-- 4. PERMISOS DE EJECUCIÓN (Para el checkout web anónimo y usuarios autenticados)
GRANT EXECUTE ON FUNCTION public.bind_payment_link_device(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.bind_payment_link_device(TEXT, TEXT, TEXT) TO authenticated;

-- 5. VERIFICACIÓN DE LAS COLUMNAS CREADAS
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payment_links'
ORDER BY ordinal_position;
