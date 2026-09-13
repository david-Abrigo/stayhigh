# Stayhigh - Documentación Integral del Sistema de Pagos

Documentación técnica y operativa completa de la plataforma **Stayhigh**: arquitectura, base de datos en Supabase, triggers de conciliación automática en tiempo real, aplicación web en React/Vite, despliegue en Render con Docker/Nginx e integración con la app móvil Android.

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Flujo de Pago y Conciliación en Tiempo Real](#2-flujo-de-pago-y-conciliación-en-tiempo-real)
3. [Base de Datos en Supabase (Tablas, Triggers y Storage)](#3-base-de-datos-en-supabase)
4. [Lógica de Conciliación Automática (Trigger Backend)](#4-lógica-de-conciliación-automática-trigger-backend)
5. [API REST Nativa en Supabase (RPC)](#5-api-rest-nativa-en-supabase-rpc)
6. [Arquitectura Multi-Tienda y Multi-Dispositivo](#6-arquitectura-multi-tienda-y-multi-dispositivo)
7. [Guía y Prompt para la App Móvil Android](#7-guía-y-prompt-para-la-app-móvil-android)
8. [Aplicación Web Frontend (Stayhigh)](#8-aplicación-web-frontend-stayhigh)
9. [Despliegue en Render con Docker y Nginx](#9-despliegue-en-render-con-docker-y-nginx)
10. [Comandos y Guía de Operación Local](#10-comandos-y-guía-de-operación-local)

---

## 1. Arquitectura General

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DEL SISTEMA                        │
└────────────────────────────────────────────────────────────────────────┘

        [ APP MÓVIL ANDROID ]                 [ APP WEB CHECKOUT ]
    (Teléfono del Comercio / POS)            (Caja / Tablet / Cliente)
                  │                                      │
       1. Notificación Yape/Plin                 2. Crear cobro
       2. Sube QR a Storage                      3. Mostrar QR y Titular
                  │                                      │
                  ▼                                      ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                     SUPABASE (CLOUD)                         │
    │                                                              │
    │  • Tablas: precharges, payment_notifications, devices...     │
    │  • Storage: Bucket "qr-codes" (Fotos de QRs Yape/Plin)       │
    │  • Motor de Conciliación (Trigger PostgreSQL PL/pgSQL):       │
    │      - Monto exacto (amount_match)                           │
    │      - Nombre normalizado (name_match)                       │
    │      - Rango de horas/tiempo (time_match)                    │
    │      - Aislamiento por dispositivo (device_id)               │
    │                                                              │
    │  • Supabase Realtime (WebSocket):                            │
    │      - Emite evento UPDATE en milisegundos                   │
    └──────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼ WebSocket en vivo
                         [ APP WEB CHECKOUT ]
                         "PAGO CONFIRMADO"
```

### Principios de Diseño:
- **Cero servidores intermedios de producción**: No se requiere pagar ni mantener un servidor Node.js/Express o Python en Render para el backend; PostgreSQL en Supabase ejecuta la conciliación atómica y serverless.
- **Frontend estático de alto rendimiento**: Servido por **Nginx** en Alpine Linux dentro de un contenedor Docker en el puerto 8080.
- **Seguridad**: La aplicación web y móvil únicamente utilizan la clave pública `anon`. La clave secreta `service_role` **nunca** se expone en los clientes.

---

## 2. Flujo de Pago y Conciliación en Tiempo Real

1. **Creación del Cobro**:
   - En la app web o POS, se ingresan: **Nombres**, **Apellidos** y **Monto** (`S/`).
   - Se genera un código único de operación (ej: `CHK-YJ85PUU`) y se inserta en Supabase en estado `WAITING`.
2. **Visualización del QR y Titular**:
   - La pantalla muestra la **foto estática del QR de Yape/Plin** del comercio.
   - Arriba del QR muestra la etiqueta de verificación: `Titular en Yape: JUAN PER***`.
   - Muestra el monto exacto a transferir.
3. **Pago del Cliente**:
   - El cliente abre su aplicación Yape o Plin en su celular, escanea la foto del QR, verifica el titular (`JUAN PER***`) y transfiere el monto exacto.
4. **Captura de la Notificación**:
   - El teléfono Android del comercio recibe la notificación push: *"Lucas Beraldo te envió S/ 15.00"*.
   - El servicio en segundo plano de la app Android extrae el nombre, el monto y la fecha, e inserta la fila en `payment_notifications`.
5. **Ejecución del Disparador (Trigger PostgreSQL)**:
   - En menos de **50 milisegundos**, PostgreSQL compara monto, nombre normalizado y rango de horas.
   - Cambia el estado de `precharges` de `WAITING` a `MATCHED`.
6. **Notificación Push WebSocket**:
   - Supabase Realtime detecta el `UPDATE` en la tabla `precharges` y lo empuja por WebSocket.
   - La pantalla web cambia automáticamente a **"PAGO CONFIRMADO"**.

---

## 3. Base de Datos en Supabase

### Tablas Principales

| Tabla | Propósito | Columnas Clave |
|---|---|---|
| `precharges` | Registra los cobros generados | `id`, `public_id`, `expected_name`, `expected_name_normalized`, `expected_amount`, `status`, `created_at`, `expires_at`, `device_id`, `matched_at` |
| `payment_notifications` | Notificaciones capturadas por Android | `id`, `notification_id`, `device_id`, `source_package`, `detected_name`, `detected_name_normalized`, `detected_amount`, `received_at_device`, `processed` |
| `payment_matches` | Registro histórico de auditoría de cada match | `id`, `precharge_id`, `notification_id`, `amount_match`, `name_match`, `time_match`, `duplicate`, `ambiguous`, `result`, `details` |
| `payment_events` | Bitácora de eventos del sistema | `id`, `precharge_id`, `notification_id`, `event_type`, `details`, `created_at` |
| `devices` | Dispositivos Android autorizados | `id`, `device_name`, `device_token_hash`, `active`, `last_seen_at` |
| `merchant_config` | Perfiles de tienda, fotos de QR y titular | `id` (slug de tienda), `device_id`, `merchant_name`, `merchant_tag`, `qr_image_url` |

### Storage (Buckets)
- **`qr-codes`**: Bucket público donde se almacenan las fotos estáticas de los códigos QR de Yape/Plin subidas desde la app Android.

---

## 4. Lógica de Conciliación Automática (Trigger Backend)

El script [supabase_backend_matching.sql](file:///c:/Users/User/Documents/Gemini%20cli%20proyects/webPagos/supabase_backend_matching.sql) contiene el disparador que ejecuta la conciliación:

```sql
-- Normalización de nombres (quita tildes, mayúsculas, espacios dobles)
CREATE OR REPLACE FUNCTION public.normalize_text(input_text text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF input_text IS NULL THEN RETURN ''; END IF;
  RETURN upper(translate(trim(regexp_replace(input_text, '\s+', ' ', 'g')), 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouAEIOUnNuU'));
END;
$$;
```

### Criterios de Coincidencia:
1. **Monto Exacto (`amount_match`)**:
   `p.expected_amount = NEW.detected_amount`
2. **Nombre Normalizado (`name_match`)**:
   `p.expected_name_normalized = v_name_clean OR v_name_clean LIKE '%' || p.expected_name_normalized || '%'`
3. **Rango de Horas / Tiempo (`time_match`)**:
   La notificación debe haber ocurrido entre el momento de creación del cobro (`created_at - 2 min`) y su expiración (`expires_at + 2 min`).
4. **Filtro Multi-Dispositivo**:
   `(p.device_id IS NULL OR p.device_id = NEW.device_id)`
5. **Anti-Duplicados**:
   Verifica que la notificación no haya sido usada previamente en otro match.

### Activación de Realtime
Para que Supabase emita los eventos a los navegadores:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.precharges;
ALTER TABLE public.precharges REPLICA IDENTITY FULL;
```

---

## 5. API REST Nativa en Supabase (RPC)

Para crear cobros o consultar estados desde cualquier otra app externa (Android, iOS, POS, backend en Python o Node.js), se definieron funciones PostgreSQL expuestas como endpoints REST:

### Endpoint: Crear Cobro
- **URL**: `POST https://<tu-proyecto>.supabase.co/rest/v1/rpc/create_precharge`
- **Headers**:
  - `apikey`: `<tu_anon_key>`
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "p_first_name": "Carlos",
    "p_last_name": "Mendoza",
    "p_amount": 25.00,
    "p_description": "Mesa 4"
  }
  ```
- **Respuesta**:
  ```json
  {
    "success": true,
    "id": "uuid-...",
    "public_id": "CHK-91FA7B2",
    "expected_name": "Carlos Mendoza",
    "expected_amount": 25.00,
    "status": "WAITING",
    "pay_url": "https://tu-checkout.onrender.com/pay/CHK-91FA7B2",
    "expires_at": "2026-09-13T01:30:00Z"
  }
  ```

### Endpoint: Consultar Estado de Cobro
- **URL**: `POST https://<tu-proyecto>.supabase.co/rest/v1/rpc/get_precharge_status`
- **Body**:
  ```json
  {
    "p_public_id": "CHK-91FA7B2"
  }
  ```
- **Respuesta**:
  ```json
  {
    "success": true,
    "public_id": "CHK-91FA7B2",
    "status": "MATCHED",
    "is_confirmed": true,
    "matched_at": "2026-09-13T01:15:20Z"
  }
  ```

---

## 6. Arquitectura Multi-Tienda y Multi-Dispositivo

El sistema soporta múltiples tiendas o cajas independientes sobre **un solo despliegue en Render**:

```text
https://tu-checkout.onrender.com/bodega-don-pepe
https://tu-checkout.onrender.com/farmacia-san-juan
https://tu-checkout.onrender.com/caja-2
```

### Cómo opera el aislamiento:
1. Cada tienda registra en `merchant_config` su propio `id` (slug de tienda), su `device_id` asignado, su foto de QR y su titular.
2. Al abrir el enlace `/bodega-don-pepe`, la web muestra la foto de QR de Don Pepe y su titular (`JOSÉ PER***`).
3. Al generar el cobro, se asocia automáticamente el `device_id` de Don Pepe.
4. Cuando el cliente paga con Yape, el teléfono de Don Pepe envía la notificación a `payment_notifications`.
5. El Trigger evalúa `p.device_id = NEW.device_id`, garantizando que las notificaciones de Don Pepe **únicamente** confirmen los cobros de su tienda.

---

## 7. Guía y Prompt para la App Móvil Android

Para configurar la aplicación móvil Android que captura pagos y sube los códigos QR:

### Lógica de Generación de Etiqueta (Kotlin):
```kotlin
fun generateMerchantTag(firstName: String, lastName: String): String {
    val cleanFirst = firstName.trim().replaceFirstChar { it.uppercase() }
    val cleanLast = lastName.trim().uppercase()
    val threeLetters = if (cleanLast.length >= 3) cleanLast.substring(0, 3) else cleanLast
    return "$cleanFirst $threeLetters***"
}
// "Lucas" + "Beraldo" -> "Lucas BER***"
```

### Subida de Imagen a Supabase Storage:
- **Método**: `POST https://<proyecto>.supabase.co/storage/v1/object/qr-codes/qr_{slug}.jpg`
- **Headers**:
  - `apikey`: `<tu_anon_key>`
  - `Authorization`: `Bearer <tu_anon_key>`
  - `Content-Type`: `image/jpeg`
  - `x-upsert`: `true`
- **Body**: Bytes comprimidos de la foto del QR.

### Registro en Base de Datos (`merchant_config`):
- **Método**: `POST https://<proyecto>.supabase.co/rest/v1/merchant_config`
- **Header**: `Prefer: resolution=merge-duplicates`
- **Body JSON**:
  ```json
  {
    "id": "bodega-don-pepe",
    "device_id": "917bf02b-de83-4ecf-823b-83644c03921d",
    "merchant_name": "Bodega Don Pepe",
    "merchant_tag": "José PER***",
    "qr_image_url": "https://<proyecto>.supabase.co/storage/v1/object/public/qr-codes/qr_bodega-don-pepe.jpg",
    "updated_at": "2026-09-13T01:00:00Z"
  }
  ```

---

## 8. Aplicación Web Frontend (Stayhigh)

Construida con:
- **React 18**
- **Vite 6**
- **TypeScript 5**
- **Tailwind CSS** (Paleta oficial: `#003366`, `#2563EB`, `#16A34A`, `#D97706`, `#DC2626`, `#F8FAFC`)
- **Supabase JavaScript SDK** (`@supabase/supabase-js`)
- **Lucide Icons** (Iconografía SVG limpia, sin emojis)

### Vistas Principales:
1. **Formulario de Cobro ([PaymentForm.tsx](file:///c:/Users/User/Documents/Gemini%20cli%20proyects/webPagos/src/components/PaymentForm.tsx))**:
   - Nombres y Apellidos en casillas separadas con aviso de ortografía exacta.
   - Validación de monto mayor a 0 con máximo 2 decimales.
   - Descripción opcional.
2. **Pantalla de QR y Estado ([PaymentQR.tsx](file:///c:/Users/User/Documents/Gemini%20cli%20proyects/webPagos/src/components/PaymentQR.tsx))**:
   - Muestra la foto estática del QR de Yape y la etiqueta `Titular en Yape / Plin: JUAN PER***`.
   - Botones para copiar código de operación y enlace público.
   - Controles de prueba DEV MODE (en modo simulación).
3. **Página Pública de Cliente ([PublicPayPage.tsx](file:///c:/Users/User/Documents/Gemini%20cli%20proyects/webPagos/src/components/PublicPayPage.tsx))**:
   - Accesible en `/pay/:publicId`.
   - Vista de solo lectura para el cliente que escanea o abre el enlace.
   - Sincronizada en tiempo real mediante WebSocket.

---

## 9. Despliegue en Render con Docker y Nginx

### Dockerfile Multi-Stage
```dockerfile
# Etapa 1: Compilación de activos estáticos
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

ARG VITE_API_URL
ARG VITE_PUBLIC_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_MOCK_MODE=false

ENV VITE_API_URL=$VITE_API_URL \
    VITE_PUBLIC_URL=$VITE_PUBLIC_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_MOCK_MODE=$VITE_MOCK_MODE

COPY . .
RUN npm run build

# Etapa 2: Servidor de producción Nginx
FROM nginx:alpine
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Configuración Nginx (`nginx.conf`)
- Escucha en el **puerto 8080** (`listen 8080;`), estándar para Render.
- Enrutamiento SPA con fallback automático:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
- Compresión Gzip y encabezados de caché inmutable para archivos estáticos (`/assets/`).

### Pasos para Desplegar en Render:
1. Subir el repositorio a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Stayhigh payment checkout con Docker y Supabase Realtime"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```
2. En el panel de **Render**:
   - Pulsa **New +** → **Web Service**.
   - Conecta tu repositorio de GitHub.
   - Selecciona **Runtime**: **Docker**.
   - Render detectará automáticamente el `Dockerfile`.
3. En la sección **Environment**, define las variables:
   - `VITE_SUPABASE_URL`: `https://svhvkrtnjkcpinfanbbe.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: tu clave anónima pública
   - `VITE_PUBLIC_URL`: la URL pública de Render (ej. `https://stayhigh.onrender.com`)
   - `VITE_MOCK_MODE`: `false`
4. Pulsa **Deploy Web Service**.

---

## 10. Comandos y Guía de Operación Local

### Ejecutar Localmente con Vite
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```
Abrir en el navegador: [http://localhost:5173/](http://localhost:5173/)

### Compilar para Producción
```bash
npm run build
```

### Probar Contenedor Docker Localmente
```bash
# Construir imagen Docker
docker build -t payment-checkout .

# Ejecutar contenedor en puerto 8080
docker run -d -p 8080:8080 --name stayhigh-app payment-checkout

# Abrir en navegador
http://localhost:8080
```

---

## Resumen de Archivos Clave del Proyecto

```text
webPagos/
├── DOCUMENTACION_COMPLETA_SISTEMA.md  # Este manual completo
├── README.md                          # Guía rápida de inicio
├── supabase_backend_matching.sql      # Triggers y conciliación en PostgreSQL
├── supabase_api_functions.sql         # API RPC (create_precharge y get_status)
├── Dockerfile                         # Multi-stage build Node -> Nginx Alpine
├── nginx.conf                         # Configuración Nginx (puerto 8080, SPA fallback)
├── .env                               # Variables de entorno locales
├── .env.example                       # Plantilla de variables de entorno
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                 # Barra superior
│   │   ├── PaymentForm.tsx            # Formulario (Nombres, Apellidos, Monto)
│   │   ├── PaymentQR.tsx              # QR estático, Titular y estado en vivo
│   │   ├── PaymentStatus.tsx          # Badges de estados
│   │   └── PublicPayPage.tsx          # Vista pública /pay/:publicId
│   ├── hooks/
│   │   └── usePrechargeRealtime.ts    # WebSocket a Supabase Realtime
│   ├── services/
│   │   ├── api.ts                     # Inserción a Supabase y configuración de comercio
│   │   └── supabase.ts                # Cliente seguro de Supabase
│   ├── types/
│   │   └── payment.ts                 # Tipos TypeScript
│   ├── App.tsx                        # Enrutador principal
│   └── main.tsx                       # Punto de entrada de React
```
