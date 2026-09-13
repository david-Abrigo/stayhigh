-- ==============================================================================
-- STAYHIGH: AGREGAR MENSAJES PERSONALIZADOS DEL VENDEDOR EN SUPABASE
-- Ejecutar este script en el SQL Editor de tu proyecto Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Agregar columnas en merchant_config (mensajes predeterminados del comercio/tienda)
ALTER TABLE public.merchant_config 
ADD COLUMN IF NOT EXISTS seller_message text,
ADD COLUMN IF NOT EXISTS confirmation_message text;

-- 2. Agregar columnas en precharges (mensajes asociados a cada orden de cobro)
ALTER TABLE public.precharges 
ADD COLUMN IF NOT EXISTS seller_message text,
ADD COLUMN IF NOT EXISTS confirmation_message text;

-- Ejemplo opcional: Actualizar tu tienda actual con mensajes por defecto
-- UPDATE public.merchant_config
-- SET seller_message = '¡Bienvenido! Revisa tus datos antes de transferir por Yape / Plin.',
--     confirmation_message = '¡Gracias por tu compra! Tu pedido ha sido confirmado y está en preparación.'
-- WHERE id = '43383af2-a4e2-4e36-a4d7-20e8267c33fe';
