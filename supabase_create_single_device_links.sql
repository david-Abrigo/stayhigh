-- ==============================================================================
-- MIGRACIÓN SUPABASE: ENLACES EXCLUSIVOS PARA UN SOLO DISPOSITIVO O PERSONA
-- Permite que un enlace de cobro se vincule estrictamente al primer celular/PC
-- que lo abra, impidiendo que sea compartido, reenviado o abierto por terceros.
-- ==============================================================================

-- 1. EXTENDER TABLA payment_links CON COLUMNAS DE VINCULACIÓN DE DISPOSITIVO
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS is_single_device BOOLEAN DEFAULT FALSE;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS locked_device_token TEXT DEFAULT NULL;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS target_customer_name TEXT DEFAULT NULL;
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS device_user_agent TEXT DEFAULT NULL;

-- 2. ÍNDICES DE BÚSQUEDA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_payment_links_single_device ON payment_links(is_single_device) WHERE is_single_device = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_links_device_token ON payment_links(locked_device_token) WHERE locked_device_token IS NOT NULL;

-- 3. FUNCIÓN ATÓMICA DE VINCULACIÓN (Previene condiciones de carrera concurrentes)
CREATE OR REPLACE FUNCTION bind_payment_link_device(
    p_code TEXT,
    p_device_token TEXT,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_link RECORD;
    v_updated_id UUID;
BEGIN
    -- 1. Buscar el enlace de cobro
    SELECT id, code, is_single_device, locked_device_token, first_opened_at, status
    INTO v_link
    FROM payment_links
    WHERE code = p_code;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'LINK_NOT_FOUND'
        );
    END IF;

    -- 2. Si el enlace no es de dispositivo exclusivo, permitir acceso libre
    IF v_link.is_single_device IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', true,
            'reason', 'NOT_RESTRICTED'
        );
    END IF;

    -- 3. Si el enlace ya tiene un dispositivo asignado
    IF v_link.locked_device_token IS NOT NULL THEN
        -- Si coincide con el mismo dispositivo que lo abrió originalmente: ACCESO CONCEDIDO
        IF v_link.locked_device_token = p_device_token THEN
            RETURN jsonb_build_object(
                'success', true,
                'reason', 'SAME_DEVICE',
                'first_opened_at', v_link.first_opened_at
            );
        ELSE
            -- Si es otro celular, navegador o tercero: ACCESO DENEGADO
            RETURN jsonb_build_object(
                'success', false,
                'reason', 'LOCKED_OTHER_DEVICE',
                'first_opened_at', v_link.first_opened_at
            );
        END IF;
    END IF;

    -- 4. Si el enlace está libre y es la primera apertura: VINCULAR ATÓMICAMENTE
    UPDATE payment_links
    SET locked_device_token = p_device_token,
        first_opened_at = now(),
        device_user_agent = p_user_agent,
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
        -- En caso de competencia concurrente al mismo milisegundo
        SELECT locked_device_token, first_opened_at INTO v_link
        FROM payment_links
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

-- 4. PERMISOS DE EJECUCIÓN PÚBLICA PARA EL CHECKOUT WEB (anon)
GRANT EXECUTE ON FUNCTION bind_payment_link_device(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION bind_payment_link_device(TEXT, TEXT, TEXT) TO authenticated;
