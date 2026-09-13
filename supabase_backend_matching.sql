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

-- 4.1 Normalizador Yape (PrimerNombre + 3 primeras letras del apellido + *)
CREATE OR REPLACE FUNCTION public.to_yape_masked(p_name text, p_meta jsonb DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_first text;
  v_last text;
  v_clean_first text;
  v_clean_last text;
  v_parts text[];
BEGIN
  -- Si ya viene precalculado en metadata
  IF p_meta IS NOT NULL AND p_meta->>'yape_masked_name' IS NOT NULL AND length(trim(p_meta->>'yape_masked_name')) >= 3 THEN
    RETURN upper(trim(p_meta->>'yape_masked_name'));
  END IF;

  -- Si vienen first_name y last_name en metadata
  IF p_meta IS NOT NULL AND p_meta->>'first_name' IS NOT NULL AND p_meta->>'last_name' IS NOT NULL THEN
    v_first := split_part(trim(p_meta->>'first_name'), ' ', 1);
    v_last := split_part(trim(p_meta->>'last_name'), ' ', 1);
  ELSE
    v_parts := regexp_split_to_array(trim(COALESCE(p_name, '')), '\s+');
    IF array_length(v_parts, 1) IS NULL OR array_length(v_parts, 1) = 0 THEN
      RETURN '';
    ELSIF array_length(v_parts, 1) = 1 THEN
      RETURN public.normalize_text(v_parts[1]);
    ELSE
      v_first := v_parts[1];
      v_last := v_parts[2];
    END IF;
  END IF;

  v_clean_first := public.normalize_text(v_first);
  v_clean_last := public.normalize_text(v_last);

  IF length(v_clean_last) >= 3 THEN
    RETURN v_clean_first || ' ' || substring(v_clean_last from 1 for 3) || '*';
  ELSE
    RETURN v_clean_first || ' ' || v_clean_last || '*';
  END IF;
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
  v_has_asterisk BOOLEAN;
  v_notif_time TIMESTAMPTZ;
  v_matched_precharge_id UUID;
  v_match_count INTEGER;
  v_is_duplicate BOOLEAN;
BEGIN
  IF NEW.detected_amount IS NULL OR NEW.processed = true THEN
    RETURN NEW;
  END IF;

  v_name_clean := public.normalize_text(NEW.detected_name);
  v_has_asterisk := (v_name_clean LIKE '%*%');
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

  -- BÚSQUEDA: Monto primero, luego coincidencia inteligente de nombre según presencia de '*'
  SELECT COUNT(*), MIN(p.id::text)::uuid
  INTO v_match_count, v_matched_precharge_id
  FROM public.precharges p
  WHERE p.status = 'WAITING'
    AND p.expected_amount = NEW.detected_amount
    AND (
      CASE
        -- CASO 1: Formato Yape con asterisco (ej. 'MILAGROS QUI*', 'ROSA COL*', 'DAVID ABR*')
        WHEN v_has_asterisk THEN (
          v_name_clean = public.to_yape_masked(p.expected_name, p.metadata)
          OR (
            p.metadata IS NOT NULL
            AND upper(COALESCE(p.metadata->>'yape_masked_name', '')) = v_name_clean
          )
          OR (
            -- Comparar primer nombre y 3 primeras letras de apellido con asterisco
            split_part(v_name_clean, ' ', 1) = split_part(p.expected_name_normalized, ' ', 1)
            AND v_name_clean LIKE split_part(p.expected_name_normalized, ' ', 1) || ' ' || substring(split_part(COALESCE(p.metadata->>'last_name', split_part(p.expected_name_normalized, ' ', 2)) from 1 for 3)) || '%'
          )
        )
        -- CASO 2: Otras plataformas con nombres completos (ej. Plin sin asterisco)
        ELSE (
          p.expected_name_normalized = v_name_clean
          OR v_name_clean LIKE '%' || p.expected_name_normalized || '%'
          OR p.expected_name_normalized LIKE '%' || v_name_clean || '%'
          OR (
            split_part(p.expected_name_normalized, ' ', 1) = split_part(v_name_clean, ' ', 1)
            AND (
              split_part(p.expected_name_normalized, ' ', 2) = split_part(v_name_clean, ' ', 2)
              OR v_name_clean LIKE '%' || split_part(p.expected_name_normalized, ' ', 2) || '%'
            )
          )
        )
      END
    )
    AND (v_notif_time >= (p.created_at - INTERVAL '2 minutes'))
    AND (v_notif_time <= (p.expires_at + INTERVAL '2 minutes'))
    AND (NEW.device_id IS NULL OR p.device_id IS NULL OR p.device_id = NEW.device_id);

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
        CASE
          WHEN v_has_asterisk THEN (
            v_name_clean = public.to_yape_masked(expected_name, metadata)
            OR (
              metadata IS NOT NULL
              AND upper(COALESCE(metadata->>'yape_masked_name', '')) = v_name_clean
            )
            OR (
              split_part(v_name_clean, ' ', 1) = split_part(expected_name_normalized, ' ', 1)
              AND v_name_clean LIKE split_part(expected_name_normalized, ' ', 1) || ' ' || substring(split_part(COALESCE(metadata->>'last_name', split_part(expected_name_normalized, ' ', 2)) from 1 for 3)) || '%'
            )
          )
          ELSE (
            expected_name_normalized = v_name_clean
            OR v_name_clean LIKE '%' || expected_name_normalized || '%'
            OR expected_name_normalized LIKE '%' || v_name_clean || '%'
            OR (
              split_part(expected_name_normalized, ' ', 1) = split_part(v_name_clean, ' ', 1)
              AND (
                split_part(expected_name_normalized, ' ', 2) = split_part(v_name_clean, ' ', 2)
                OR v_name_clean LIKE '%' || split_part(expected_name_normalized, ' ', 2) || '%'
              )
            )
          )
        END
      )
      AND (v_notif_time >= (created_at - INTERVAL '2 minutes'))
      AND (v_notif_time <= (expires_at + INTERVAL '2 minutes'))
      AND (NEW.device_id IS NULL OR device_id IS NULL OR device_id = NEW.device_id);

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
  v_has_asterisk BOOLEAN;
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
    v_has_asterisk := (v_name_clean LIKE '%*%');
    v_notif_time := COALESCE(r.received_at_device, r.created_at, now());

    SELECT COUNT(*), MIN(p.id::text)::uuid
    INTO v_match_count, v_matched_precharge_id
    FROM public.precharges p
    WHERE p.status = 'WAITING'
      AND p.expected_amount = r.detected_amount
      AND (
        CASE
          WHEN v_has_asterisk THEN (
            v_name_clean = public.to_yape_masked(p.expected_name, p.metadata)
            OR (
              p.metadata IS NOT NULL
              AND upper(COALESCE(p.metadata->>'yape_masked_name', '')) = v_name_clean
            )
            OR (
              split_part(v_name_clean, ' ', 1) = split_part(p.expected_name_normalized, ' ', 1)
              AND v_name_clean LIKE split_part(p.expected_name_normalized, ' ', 1) || ' ' || substring(split_part(COALESCE(p.metadata->>'last_name', split_part(p.expected_name_normalized, ' ', 2)) from 1 for 3)) || '%'
            )
          )
          ELSE (
            p.expected_name_normalized = v_name_clean
            OR v_name_clean LIKE '%' || p.expected_name_normalized || '%'
            OR p.expected_name_normalized LIKE '%' || v_name_clean || '%'
            OR (
              split_part(p.expected_name_normalized, ' ', 1) = split_part(v_name_clean, ' ', 1)
              AND (
                split_part(p.expected_name_normalized, ' ', 2) = split_part(v_name_clean, ' ', 2)
                OR v_name_clean LIKE '%' || split_part(p.expected_name_normalized, ' ', 2) || '%'
              )
            )
          )
        END
      )
      AND (v_notif_time >= (p.created_at - INTERVAL '2 minutes'))
      AND (v_notif_time <= (p.expires_at + INTERVAL '2 minutes'))
      AND (r.device_id IS NULL OR p.device_id IS NULL OR p.device_id = r.device_id);

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
