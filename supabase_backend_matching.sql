-- ==============================================================================
-- STAYHIGH: ACTIVAR SUPABASE REALTIME + MATCHING AUTOMÁTICO
-- ==============================================================================

-- 1. ACTIVAR REPLICACIÓN REALTIME EN LA TABLA PRECHARGES (Indispensable para que la web reciba el evento en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE public.precharges;
ALTER TABLE public.precharges REPLICA IDENTITY FULL;

-- 2. Asegurar que exista la columna updated_at
ALTER TABLE public.precharges ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Políticas RLS para precharges
ALTER TABLE public.precharges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow precharges insert for anon" ON public.precharges;
CREATE POLICY "Allow precharges insert for anon"
ON public.precharges
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow precharges select for anon" ON public.precharges;
CREATE POLICY "Allow precharges select for anon"
ON public.precharges
FOR SELECT
TO anon
USING (true);

-- 4. Normalizador de texto (elimina tildes, mayúsculas y espacios extra)
CREATE OR REPLACE FUNCTION public.normalize_text(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN '';
  END IF;

  RETURN upper(
    translate(
      trim(regexp_replace(input_text, '\s+', ' ', 'g')),
      'áéíóúÁÉÍÓÚñÑüÜ',
      'aeiouAEIOUnNuU'
    )
  );
END;
$$;

-- Triggers de normalización automática de nombres
CREATE OR REPLACE FUNCTION public.fn_normalize_precharge_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.expected_name_normalized := public.normalize_text(NEW.expected_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_normalize_precharge_name ON public.precharges;
CREATE TRIGGER tr_normalize_precharge_name
BEFORE INSERT OR UPDATE OF expected_name ON public.precharges
FOR EACH ROW
EXECUTE FUNCTION public.fn_normalize_precharge_name();

CREATE OR REPLACE FUNCTION public.fn_normalize_notification_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.detected_name_normalized := public.normalize_text(NEW.detected_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_normalize_notification_name ON public.payment_notifications;
CREATE TRIGGER tr_normalize_notification_name
BEFORE INSERT OR UPDATE OF detected_name ON public.payment_notifications
FOR EACH ROW
EXECUTE FUNCTION public.fn_normalize_notification_name();

-- 5. FUNCIÓN PRINCIPAL DE MATCHING (Disparada por el Trigger en payment_notifications)
CREATE OR REPLACE FUNCTION public.fn_process_payment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name_clean TEXT;
  v_notif_time TIMESTAMPTZ;
  v_matched_precharge_id UUID;
  v_match_count INTEGER;
  v_is_duplicate BOOLEAN;
BEGIN
  IF NEW.detected_amount IS NULL OR NEW.processed = true THEN
    RETURN NEW;
  END IF;

  v_name_clean := public.normalize_text(NEW.detected_name);
  v_notif_time := COALESCE(NEW.received_at_device, NEW.created_at, now());

  -- Verificar Duplicado
  SELECT EXISTS(
    SELECT 1 FROM public.payment_matches
    WHERE notification_id = NEW.id AND result = 'MATCHED'
  ) INTO v_is_duplicate;

  IF v_is_duplicate THEN
    INSERT INTO public.payment_matches (
      notification_id, amount_match, name_match, time_match, duplicate, ambiguous, result, details, created_at
    ) VALUES (
      NEW.id, false, false, false, true, false, 'DUPLICATE',
      jsonb_build_object('reason', 'La notificación ya fue conciliada previamente'), now()
    );
    UPDATE public.payment_notifications SET processed = true WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- BÚSQUEDA CON MONTO, NOMBRE Y RANGO DE HORAS
  SELECT COUNT(*), MIN(p.id::text)::uuid
  INTO v_match_count, v_matched_precharge_id
  FROM public.precharges p
  WHERE p.status = 'WAITING'
    AND p.expected_amount = NEW.detected_amount
    AND (
      p.expected_name_normalized = v_name_clean
      OR v_name_clean LIKE '%' || p.expected_name_normalized || '%'
      OR p.expected_name_normalized LIKE '%' || v_name_clean || '%'
    )
    AND (v_notif_time >= (p.created_at - INTERVAL '2 minutes'))
    AND (v_notif_time <= (p.expires_at + INTERVAL '2 minutes'));

  -- CASO 1: Coincidencia única -> MATCHED
  IF v_match_count = 1 THEN
    UPDATE public.precharges
    SET status = 'MATCHED',
        matched_notification_id = NEW.id,
        matched_at = now()
    WHERE id = v_matched_precharge_id;

    INSERT INTO public.payment_matches (
      precharge_id, notification_id, amount_match, name_match, time_match, duplicate, ambiguous, result, details, created_at
    ) VALUES (
      v_matched_precharge_id, NEW.id, true, true, true, false, false, 'MATCHED',
      jsonb_build_object(
        'matched_amount', NEW.detected_amount,
        'detected_name', NEW.detected_name,
        'received_at_device', v_notif_time,
        'notification_id', NEW.notification_id
      ),
      now()
    );

    UPDATE public.payment_notifications SET processed = true WHERE id = NEW.id;

    INSERT INTO public.payment_events (
      precharge_id, notification_id, event_type, details, created_at
    ) VALUES (
      v_matched_precharge_id, NEW.id, 'PAYMENT_MATCHED',
      jsonb_build_object('status', 'MATCHED', 'source', NEW.source_package), now()
    );

  -- CASO 2: Múltiples cobros idénticos simultáneos -> AMBIGUOUS
  ELSIF v_match_count > 1 THEN
    UPDATE public.precharges
    SET status = 'AMBIGUOUS'
    WHERE status = 'WAITING'
      AND expected_amount = NEW.detected_amount
      AND (
        expected_name_normalized = v_name_clean
        OR v_name_clean LIKE '%' || expected_name_normalized || '%'
        OR expected_name_normalized LIKE '%' || v_name_clean || '%'
      )
      AND (v_notif_time >= (created_at - INTERVAL '2 minutes'))
      AND (v_notif_time <= (expires_at + INTERVAL '2 minutes'));

    INSERT INTO public.payment_matches (
      precharge_id, notification_id, amount_match, name_match, time_match, duplicate, ambiguous, result, details, created_at
    ) VALUES (
      v_matched_precharge_id, NEW.id, true, true, true, false, true, 'AMBIGUOUS',
      jsonb_build_object('coincidencias_multiples', v_match_count), now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 6. Creación del Trigger en payment_notifications
DROP TRIGGER IF EXISTS tr_process_payment_notification ON public.payment_notifications;
CREATE TRIGGER tr_process_payment_notification
AFTER INSERT ON public.payment_notifications
FOR EACH ROW
EXECUTE FUNCTION public.fn_process_payment_notification();

-- 7. Reprocesar notificaciones que ya estaban pendientes
CREATE OR REPLACE FUNCTION public.reprocess_unmatched_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_name_clean TEXT;
  v_notif_time TIMESTAMPTZ;
  v_match_count INTEGER;
  v_matched_precharge_id UUID;
  v_processed_total INTEGER := 0;
BEGIN
  FOR r IN 
    SELECT * FROM public.payment_notifications 
    WHERE processed = false 
    ORDER BY created_at ASC
  LOOP
    v_name_clean := public.normalize_text(r.detected_name);
    v_notif_time := COALESCE(r.received_at_device, r.created_at, now());

    SELECT COUNT(*), MIN(p.id::text)::uuid
    INTO v_match_count, v_matched_precharge_id
    FROM public.precharges p
    WHERE p.status = 'WAITING'
      AND p.expected_amount = r.detected_amount
      AND (
        p.expected_name_normalized = v_name_clean
        OR v_name_clean LIKE '%' || p.expected_name_normalized || '%'
        OR p.expected_name_normalized LIKE '%' || v_name_clean || '%'
      )
      AND (v_notif_time >= (p.created_at - INTERVAL '2 minutes'))
      AND (v_notif_time <= (p.expires_at + INTERVAL '2 minutes'));

    IF v_match_count = 1 THEN
      UPDATE public.precharges
      SET status = 'MATCHED',
          matched_notification_id = r.id,
          matched_at = now()
      WHERE id = v_matched_precharge_id;

      INSERT INTO public.payment_matches (
        precharge_id, notification_id, amount_match, name_match, time_match, duplicate, ambiguous, result, details, created_at
      ) VALUES (
        v_matched_precharge_id, r.id, true, true, true, false, false, 'MATCHED',
        jsonb_build_object('matched_amount', r.detected_amount, 'detected_name', r.detected_name), now()
      );

      UPDATE public.payment_notifications SET processed = true WHERE id = r.id;
      v_processed_total := v_processed_total + 1;
    END IF;
  END LOOP;

  RETURN v_processed_total;
END;
$$;

-- Ejecutar para procesar cobros en cola
SELECT public.reprocess_unmatched_notifications();
