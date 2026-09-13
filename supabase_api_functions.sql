-- ==============================================================================
-- STAYHIGH: API REST NATIVA EN SUPABASE (RPC)
-- ==============================================================================
-- Al ejecutar este script en el SQL Editor de Supabase, automáticamente
-- obtienes una API REST lista para usar en cualquier aplicación (Android, iOS,
-- backend, escritorio, etc.) usando tu clave anon pública.
-- ==============================================================================

-- 1. ENDPOINT PARA CREAR UN COBRO (POST /rest/v1/rpc/create_precharge)
CREATE OR REPLACE FUNCTION public.create_precharge(
  p_first_name text,
  p_last_name text,
  p_amount numeric,
  p_description text DEFAULT NULL,
  p_currency text DEFAULT 'PEN'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_public_id text;
  v_full_name text;
  v_full_name_norm text;
  v_expires_at timestamptz;
  v_precharge_id uuid;
  v_chars text := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  i integer;
BEGIN
  -- Validar campos obligatorios
  IF p_first_name IS NULL OR trim(p_first_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'El nombre es obligatorio');
  END IF;

  IF p_last_name IS NULL OR trim(p_last_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'El apellido es obligatorio');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Generar public_id único (CHK-XXXXXXX)
  LOOP
    v_public_id := 'CHK-';
    FOR i IN 1..7 LOOP
      v_public_id := v_public_id || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
    END LOOP;
    
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.precharges WHERE public_id = v_public_id);
  END LOOP;

  v_full_name := trim(p_first_name) || ' ' || trim(p_last_name);
  v_full_name_norm := public.normalize_text(v_full_name);
  v_expires_at := now() + INTERVAL '10 minutes';

  -- Insertar el cobro en estado WAITING
  INSERT INTO public.precharges (
    public_id,
    expected_name,
    expected_name_normalized,
    expected_amount,
    currency,
    description,
    status,
    created_at,
    expires_at,
    metadata
  ) VALUES (
    v_public_id,
    v_full_name,
    v_full_name_norm,
    round(p_amount, 2),
    COALESCE(p_currency, 'PEN'),
    p_description,
    'WAITING',
    now(),
    v_expires_at,
    jsonb_build_object('source', 'api_rpc')
  ) RETURNING id INTO v_precharge_id;

  -- Retornar la respuesta con toda la información necesaria para el QR
  RETURN jsonb_build_object(
    'success', true,
    'id', v_precharge_id,
    'public_id', v_public_id,
    'expected_name', v_full_name,
    'expected_amount', round(p_amount, 2),
    'currency', COALESCE(p_currency, 'PEN'),
    'status', 'WAITING',
    'created_at', now(),
    'expires_at', v_expires_at,
    'pay_url', 'https://tu-checkout.onrender.com/pay/' || v_public_id
  );
END;
$$;

-- 2. ENDPOINT PARA CONSULTAR EL ESTADO (POST /rest/v1/rpc/get_precharge_status)
CREATE OR REPLACE FUNCTION public.get_precharge_status(p_public_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec record;
BEGIN
  SELECT * INTO v_rec FROM public.precharges WHERE public_id = p_public_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cobro no encontrado');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'public_id', v_rec.public_id,
    'expected_name', v_rec.expected_name,
    'expected_amount', v_rec.expected_amount,
    'currency', v_rec.currency,
    'status', v_rec.status,
    'is_confirmed', (v_rec.status = 'MATCHED'),
    'matched_at', v_rec.matched_at,
    'expires_at', v_rec.expires_at
  );
END;
$$;

-- 3. PERMISOS DE EJECUCIÓN PÚBLICA PARA EL ROL ANON
GRANT EXECUTE ON FUNCTION public.create_precharge(text, text, numeric, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_precharge_status(text) TO anon, authenticated, service_role;
