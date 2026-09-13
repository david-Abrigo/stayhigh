import React from 'react';
import {
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Code2,
  TrendingUp,
  Clock,
  QrCode,
  Lock,
  ChevronRight,
  CreditCard,
  Share2
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* HERO SECTION */}
      <section className="text-center pt-6 sm:pt-10 max-w-4xl mx-auto">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-mint text-brand-obsidian text-xs sm:text-sm font-bold shadow-xs mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-mint-dark" />
          <span>Checkout Inteligente en Tiempo Real para Yape & Plin</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-brand-obsidian tracking-tight leading-[1.1] mb-6">
          El checkout que valida pagos en{' '}
          <span className="relative inline-block text-brand-obsidian">
            <span className="relative z-10 px-2">menos de 1 segundo</span>
            <span className="absolute inset-0 bg-brand-mint rounded-xl -rotate-1 -z-0"></span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-brand-subtext max-w-2xl mx-auto leading-relaxed mb-8">
          Dile adiós a las capturas de pantalla falsas y a las comisiones bancarias del 4%. Tu cliente paga desde su app bancaria y Stayhigh concilia la orden automáticamente en vivo.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
          <button
            type="button"
            onClick={() => onNavigate('/demo')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-obsidian text-white font-black text-sm uppercase tracking-wider hover:bg-black transition shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>PROBAR DEMO EN VIVO</span>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-mint group-hover:text-brand-obsidian transition">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/api')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white text-brand-obsidian font-bold text-sm hover:bg-gray-50 transition border border-black/[0.08] shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-brand-lavender-dark" />
            <span>Documentación API</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/precios')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/70 text-brand-subtext font-semibold text-sm hover:text-brand-obsidian hover:bg-white transition cursor-pointer"
          >
            <span>Ver Planes</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-mint-dark bg-emerald-50/80 border border-emerald-200/60 px-4 py-2 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Confirmación instantánea en menos de 1 segundo • 0% comisiones de pasarela</span>
        </div>
      </section>

      {/* VISUAL SHOWCASE (Inspirado en la imagen de referencia con tarjetas Verde Menta & Lavanda) */}
      <section className="max-w-4xl mx-auto">
        <div className="bg-white rounded-squircle-lg p-6 sm:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-white/80">
          <div className="text-center mb-8">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-mint-dark bg-brand-mint/40 px-3 py-1 rounded-full">
              Arquitectura Visual
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-obsidian mt-2">
              Conciliación inteligente en acción
            </h2>
            <p className="text-xs sm:text-sm text-brand-subtext mt-1 max-w-lg mx-auto">
              Diseñado para guiar al usuario a ingresar sus datos exactos y sincronizar el pago al instante.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Lado Izquierdo: Simulación del Checkout */}
            <div className="lg:col-span-7 bg-brand-bg/40 p-5 sm:p-6 rounded-3xl border border-black/[0.05]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-xs font-bold text-brand-subtext ml-2">Checkout Stayhigh</span>
                </div>
                <span className="text-[10px] font-bold bg-brand-mint px-2 py-0.5 rounded-full text-brand-obsidian">
                  LIVE
                </span>
              </div>

              {/* Botón Principal Obsidian */}
              <div className="mb-4">
                <div className="w-full py-3.5 px-5 rounded-2xl bg-brand-obsidian text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
                  <span>CONTINUAR AL PAGO</span>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Confirmación instantánea en menos de 1 segundo</span>
                </div>
              </div>

              {/* Guía de Pasos */}
              <div className="bg-white p-4 rounded-2xl border border-black/[0.04] space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full border-2 border-brand-subtext/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-brand-subtext">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-obsidian">Escribe tu nombre tal como figura en Yape</p>
                    <p className="text-[11px] text-brand-subtext">Valida el primer nombre y apellido.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full border-2 border-brand-subtext/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-brand-subtext">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-obsidian">El Yape a pagar debe ser el mismo nombre</p>
                    <p className="text-[11px] text-brand-subtext">Conciliación automática por titular.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full border-2 border-brand-subtext/40 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-brand-subtext">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-obsidian">Digita el monto exacto</p>
                    <div className="inline-block bg-brand-mint text-brand-obsidian font-black text-[10px] px-2 py-0.5 rounded-md mt-0.5">
                      S/ 10.00
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-obsidian text-white flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">4</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-obsidian">Confirmación automática</p>
                    <p className="text-[11px] text-brand-subtext">Pantalla de éxito inmediata.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Derecho: Tarjetas Verde Menta y Lavanda (Exactas a la Imagen) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Tarjeta Verde Menta */}
              <div className="bg-[#98F5A6] p-6 rounded-3xl text-brand-obsidian shadow-sm transition hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-brand-obsidian/10 px-2.5 py-1 rounded-full">
                    TITULAR EN TU YAPE
                  </span>
                  <div className="w-7 h-7 rounded-full bg-brand-obsidian/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-brand-obsidian" />
                  </div>
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-4">
                  Mismo Nombre
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-full bg-brand-obsidian/10">
                    Requisito obligatorio
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-brand-obsidian/10">
                    Yape = Formulario
                  </span>
                </div>
              </div>

              {/* Tarjeta Lavanda */}
              <div className="bg-[#B7A6FC] p-6 rounded-3xl text-brand-obsidian shadow-sm transition hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-brand-obsidian/10 px-2.5 py-1 rounded-full">
                    VALIDACIÓN EN VIVO
                  </span>
                  <div className="w-7 h-7 rounded-full bg-brand-obsidian/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-brand-obsidian" />
                  </div>
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-4">
                  &lt; 1 segundo
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 rounded-full bg-brand-obsidian/10">
                    Realtime activo
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-brand-obsidian/10">
                    Detección instantánea
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICAS & BENEFICIOS */}
      <section className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-white/80 shadow-xs text-center">
            <span className="text-3xl sm:text-4xl font-black text-brand-obsidian block">
              0%
            </span>
            <span className="text-xs font-bold text-brand-subtext mt-1 block">
              Comisiones bancarias
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-white/80 shadow-xs text-center">
            <span className="text-3xl sm:text-4xl font-black text-brand-obsidian block">
              &lt; 1s
            </span>
            <span className="text-xs font-bold text-brand-subtext mt-1 block">
              Tiempo de respuesta
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-white/80 shadow-xs text-center">
            <span className="text-3xl sm:text-4xl font-black text-brand-obsidian block">
              100%
            </span>
            <span className="text-xs font-bold text-brand-subtext mt-1 block">
              Directo a tu cuenta
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-white/80 shadow-xs text-center">
            <span className="text-3xl sm:text-4xl font-black text-brand-obsidian block">
              Anti-Fraude
            </span>
            <span className="text-xs font-bold text-brand-subtext mt-1 block">
              Matching con asterisco
            </span>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA (4 PASOS) */}
      <section className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-mint-dark bg-brand-mint/40 px-3 py-1 rounded-full">
            Flujo Operativo
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-obsidian mt-3">
            ¿Cómo funciona Stayhigh?
          </h2>
          <p className="text-sm text-brand-subtext mt-2 max-w-md mx-auto">
            La arquitectura de conciliación que conecta tu tienda con tus cuentas Yape y Plin sin fricción.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paso 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-[#98F5A6] flex items-center justify-center font-black text-brand-obsidian text-lg mb-4">
              01
            </div>
            <h3 className="text-lg font-black text-brand-obsidian mb-2">
              Generas el cobro o link
            </h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Desde nuestra API, plugin para e-commerce o con enlaces compartibles (/l/codigo) para WhatsApp e Instagram.
            </p>
          </div>

          {/* Paso 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-[#B7A6FC] flex items-center justify-center font-black text-brand-obsidian text-lg mb-4">
              02
            </div>
            <h3 className="text-lg font-black text-brand-obsidian mb-2">
              El cliente transfiere desde su app
            </h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Escanea el QR en pantalla o usa el número de tu negocio, enviando el monto exacto con su cuenta Yape o Plin.
            </p>
          </div>

          {/* Paso 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-brand-obsidian text-white flex items-center justify-center font-black text-lg mb-4">
              03
            </div>
            <h3 className="text-lg font-black text-brand-obsidian mb-2">
              Listener móvil detecta la notificación
            </h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Tu teléfono Android con la app de Stayhigh lee la alerta bancaria de forma segura y la sincroniza con Supabase en milisegundos.
            </p>
          </div>

          {/* Paso 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-[#98F5A6] flex items-center justify-center font-black text-brand-obsidian text-lg mb-4">
              04
            </div>
            <h3 className="text-lg font-black text-brand-obsidian mb-2">
              Matching instantáneo y Webhook
            </h3>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed">
              Compara monto y nombre (soportando nombres con asterisco tipo "Milagros Qui*"). Valida la orden y dispara el Webhook a tu backend.
            </p>
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="max-w-4xl mx-auto">
        <div className="bg-white rounded-squircle-lg p-8 sm:p-12 shadow-xs border border-white/80">
          <div className="text-center mb-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-brand-mint-dark bg-brand-mint/40 px-3 py-1 rounded-full">
              Versatilidad
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-obsidian mt-2">
              Diseñado para cualquier modelo de venta
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-brand-bg/30 border border-black/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-brand-obsidian text-white flex items-center justify-center mb-3">
                <Share2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-brand-obsidian mb-1">Ventas por WhatsApp</h4>
              <p className="text-xs text-brand-subtext leading-relaxed">
                Envía un enlace único con monto y concepto ya bloqueados. El cliente paga y recibes la confirmación sin pedir capturas.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-bg/30 border border-black/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-brand-mint text-brand-obsidian flex items-center justify-center mb-3">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-brand-obsidian mb-1">Tiendas E-commerce</h4>
              <p className="text-xs text-brand-subtext leading-relaxed">
                Integra nuestro checkout embebido o API REST en tu tienda online. Libera descargas o pedidos al instante.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-brand-bg/30 border border-black/[0.04]">
              <div className="w-10 h-10 rounded-xl bg-[#B7A6FC] text-brand-obsidian flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-brand-obsidian mb-1">Puntos de Venta & QR</h4>
              <p className="text-xs text-brand-subtext leading-relaxed">
                Muestra un QR en una tablet de mostrador o en el celular de tu repartidor con monto exacto en el medio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-4xl mx-auto">
        <div className="bg-brand-obsidian text-white rounded-squircle-lg p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Comienza a cobrar con Stayhigh hoy
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-8">
              Prueba la experiencia en vivo desde el navegador o consulta la documentación para integrar nuestra API en minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/demo')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#98F5A6] text-brand-obsidian font-black text-sm uppercase tracking-wider hover:bg-emerald-300 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>PROBAR DEMO AHORA</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/precios')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition cursor-pointer"
              >
                <span>Conocer Precios</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
