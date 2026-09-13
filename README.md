# Stayhigh - Payment Checkout

Aplicación web frontend moderna y ligera para la generación y administración de cobros (*precharges*) mediante códigos QR y sincronización en tiempo real con **Supabase Realtime**, diseñada para desplegarse en **Render mediante Docker y Nginx**.

> 📘 **Manual Completo del Sistema**: Para ver toda la documentación técnica detallada (arquitectura, scripts SQL de triggers en Supabase, APIs RPC, prompt de Android y soporte multi-tienda), consulta [DOCUMENTACION_COMPLETA_SISTEMA.md](DOCUMENTACION_COMPLETA_SISTEMA.md).

---

## Arquitectura

```text
React + Vite (TypeScript + Tailwind CSS)
                 ↓
           npm run build
                 ↓
               dist/
                 ↓
              Docker
                 ↓
         Nginx (Puerto 8080)
                 ↓
               Render
```

- **Frontend estático**: Servido exclusivamente por Nginx en producción. Sin Node.js ni Express en el contenedor final.
- **Backend desacoplado**: La creación de cobros se realiza mediante `POST /api/precharges` a tu backend.
- **Sincronización en vivo**: La aplicación escucha eventos de actualización (`UPDATE`) en la tabla `precharges` usando Supabase Realtime (WebSocket), sin polling ni llamadas repetitivas `setInterval`.
- **Seguridad**: Solo utiliza la clave pública `anon` de Supabase. **Nunca** se incluye `service_role` en el frontend.

---

## Requisitos Previos

- Node.js 20+ y npm
- Docker (opcional, para pruebas de contenedor local)

---

## Variables de Entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura los valores correspondientes:

```env
# URL de tu backend en Render
VITE_API_URL=https://tu-backend.onrender.com

# URL pública de este frontend (para el enlace contenido en el QR)
VITE_PUBLIC_URL=https://mi-checkout.onrender.com

# Supabase (URL base del proyecto)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública anónima de Supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Modo Demostración (true para pruebas sin backend, false para producción)
VITE_MOCK_MODE=true
```

---

## Ejecución Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   `http://localhost:5173`

4. Probar la página pública de cliente:
   `http://localhost:5173/pay/CHK-8F32A91`

---

## Ejecución con Docker

1. Construir la imagen Docker:
   ```bash
   docker build -t payment-checkout .
   ```

2. Ejecutar el contenedor (Nginx escucha internamente en el puerto 8080):
   ```bash
   docker run -d -p 8080:8080 --name stayhigh-app payment-checkout
   ```

3. Abrir en el navegador:
   `http://localhost:8080`

4. Detener y limpiar contenedor:
   ```bash
   docker stop stayhigh-app && docker rm stayhigh-app
   ```

---

## Despliegue en Render

1. Sube este repositorio a **GitHub**.
2. En tu panel de **Render**:
   - Pulsa **New +** → **Web Service**.
   - Conecta tu repositorio de GitHub.
   - Selecciona **Runtime**: **Docker**.
   - Render detectará automáticamente el `Dockerfile`.
3. En la pestaña **Environment**, define las variables de entorno necesarias:
   - `VITE_API_URL`: URL de tu backend.
   - `VITE_PUBLIC_URL`: URL asignada por Render a este servicio (ej. `https://stayhigh.onrender.com`).
   - `VITE_SUPABASE_URL`: Tu URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase.
   - `VITE_MOCK_MODE`: `false` (para conectar con backend real) o `true` (para pruebas).
4. Despliega el servicio. Render construirá la imagen y publicará la web estática sobre Nginx en el puerto 8080.

---

## Modos de Operación

### Modo Producción (`VITE_MOCK_MODE=false`)
1. El usuario completa el formulario y presiona **GENERAR QR**.
2. Envía `POST /api/precharges` al backend con `expected_name`, `expected_amount`, `currency` y `description`.
3. El backend crea el registro en Supabase con estado `WAITING` y devuelve `public_id`.
4. El frontend muestra el código QR que apunta a `${VITE_PUBLIC_URL}/pay/${public_id}`.
5. El hook `usePrechargeRealtime` abre un canal WebSocket con Supabase Realtime filtrando por el ID de precharge.
6. Cuando el backend o proceso de conciliación actualiza el estado a `MATCHED`, la interfaz muestra inmediatamente **Pago confirmado** sin necesidad de refrescar la página.

### Modo Demo (`VITE_MOCK_MODE=true`)
- Permite probar la experiencia de usuario completa y simular los estados del ciclo de vida del pago sin necesidad de tener el backend o la app Android conectados.
- Al generar un cobro, se muestra una barra de desarrollo (**DEV MODE**) con opciones:
  - **Simular pago** (`WAITING` → `MATCHED`)
  - **Simular expiración** (`WAITING` → `EXPIRED`)
  - **Simular pago ambiguo** (`WAITING` → `AMBIGUOUS`)
