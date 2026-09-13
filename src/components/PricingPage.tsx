import React, { useState } from 'react';
import {
  Check,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
  TrendingDown,
  Sparkles,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

interface PricingPageProps {
  onNavigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [monthlySales, setMonthlySales] = useState<number>(10000);
  const [avgTicket, setAvgTicket] = useState<number>(50);

  const txCount = Math.max(1, Math.round(monthlySales / (avgTicket || 1)));
  // Pasarelas tradicionales cobran aprox 3.99% + S/ 1.00 por transacción
  const traditionalFee = monthlySales * 0.0399 + txCount * 1.0;
  const stayhighFee = 49.0;
  const monthlySavings = Math.max(0, traditionalFee - stayhighFee);
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="space-y-16 max-w-5xl mx-auto pt-6">
      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-mint-dark bg-brand-mint/40 px-3 py-1 rounded-full">
          Precios Transparentes
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-obsidian tracking-tight mt-3 mb-4">
          Deja de regalar tus ganancias a las pasarelas tradicionales
        </h1>
        <p className="text-sm sm:text-base text-brand-subtext leading-relaxed">
          Sin comisiones ocultas por porcentaje. Con Stayhigh pagas una tarifa plana o comienzas gratis, y el 100% del dinero entra directo a tu cuenta de banco.
        </p>
      </div>

      {/* CALCULADORA DE AHORRO */}
      <div className="bg-white rounded-squircle-lg p-6 sm:p-10 shadow-xs border border-white/80">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-brand-mint text-brand-obsidian flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-black text-brand-obsidian">Calculadora de Ahorro Neto</h3>
            <p className="text-xs text-brand-subtext">Compara Stayhigh vs Niubiz / Culqi / Mercado Pago (3.99% + S/ 1)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Sliders */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-brand-obsidian mb-2">
                <span>Ventas mensuales estimadas:</span>
                <span className="text-base text-brand-obsidian font-black">
                  S/ {monthlySales.toLocaleString('es-PE')}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={monthlySales}
                onChange={(e) => setMonthlySales(Number(e.target.value))}
                className="w-full accent-brand-obsidian cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-brand-obsidian mb-2">
                <span>Ticket promedio por venta:</span>
                <span className="text-base text-brand-obsidian font-black">
                  S/ {avgTicket.toLocaleString('es-PE')}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full accent-brand-obsidian cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
              <span className="text-[11px] text-brand-subtext mt-1 block">
                Aproximadamente {txCount} cobros procesados al mes.
              </span>
            </div>
          </div>

          {/* Resultado del Ahorro */}
          <div className="lg:col-span-5 bg-[#98F5A6] p-6 rounded-3xl text-brand-obsidian shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider bg-brand-obsidian/10 px-2 py-0.5 rounded-full">
              TU AHORRO ESTIMADO
            </span>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-black block">
                S/ {Math.round(monthlySavings).toLocaleString('es-PE')}{' '}
                <span className="text-sm font-bold text-brand-obsidian/80">/ mes</span>
              </span>
              <span className="text-sm font-bold block text-brand-obsidian/90 mt-1">
                ¡S/ {Math.round(yearlySavings).toLocaleString('es-PE')} de ahorro al año!
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-brand-obsidian/10 text-xs text-brand-obsidian/80 space-y-1">
              <p>• Comisión pasarela tradicional: S/ {Math.round(traditionalFee).toLocaleString('es-PE')}</p>
              <p>• Costo con Stayhigh Pro: S/ 49.00 fijo</p>
            </div>
          </div>
        </div>
      </div>

      {/* PLANES DE PRECIO (3 Tarjetas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* Plan 1: Starter */}
        <div className="bg-white rounded-squircle-lg p-6 sm:p-8 border border-white/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-subtext block mb-2">
              Starter
            </span>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-brand-obsidian">S/ 0</span>
              <span className="text-xs font-semibold text-brand-subtext">/ mes</span>
            </div>
            <p className="text-xs text-brand-subtext mb-6">
              Para emprendedores que quieren comenzar a probar el checkout sin costo.
            </p>

            <ul className="space-y-3 text-xs font-medium text-brand-obsidian mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hasta 30 cobros / mes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Enlaces de cobro (/l/codigo)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>QR Estático y Dinámico</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Soporte 1 cuenta Yape / Plin</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/demo')}
            className="w-full py-3.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-obsidian font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            Empezar Gratis
          </button>
        </div>

        {/* Plan 2: Pro (Destacado Verde Menta) */}
        <div className="bg-[#98F5A6] rounded-squircle-lg p-6 sm:p-8 shadow-md flex flex-col justify-between relative transform md:-translate-y-2 border-2 border-brand-obsidian/10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-obsidian text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            MÁS RECOMENDADO
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-obsidian">
                Negocio Pro
              </span>
              <span className="w-2 h-2 rounded-full bg-brand-obsidian animate-pulse"></span>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-brand-obsidian">S/ 49</span>
              <span className="text-xs font-bold text-brand-obsidian/80">/ mes</span>
            </div>
            <p className="text-xs text-brand-obsidian/80 mb-6">
              Para tiendas online y negocios que necesitan cobros automáticos en vivo sin límites.
            </p>

            <ul className="space-y-3 text-xs font-bold text-brand-obsidian mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Cobros automáticos ILIMITADOS</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Conciliación en &lt; 1 segundo</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Matching inteligente Yape ("Nombre Ape*")</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>API REST & Webhooks en tiempo real</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>App Android Listener incluida</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/demo')}
            className="w-full py-4 px-4 rounded-xl bg-brand-obsidian text-white font-black text-xs uppercase tracking-wider hover:bg-black transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Obtener Plan Pro</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Plan 3: Enterprise (Lavanda) */}
        <div className="bg-[#B7A6FC] rounded-squircle-lg p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-obsidian block mb-2">
              Empresa / Scale
            </span>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-brand-obsidian">S/ 149</span>
              <span className="text-xs font-bold text-brand-obsidian/80">/ mes</span>
            </div>
            <p className="text-xs text-brand-obsidian/80 mb-6">
              Para plataformas de alto tráfico, franquicias o múltiples cuentas bancarias simultáneas.
            </p>

            <ul className="space-y-3 text-xs font-bold text-brand-obsidian mb-8">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Todo lo del plan Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Múltiples teléfonos / cuentas Yape & Plin</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Enrutamiento dinámico de cobros</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>SLA 99.9% y reintentos automáticos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-obsidian shrink-0" />
                <span>Soporte prioritario WhatsApp 24/7</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/demo')}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-obsidian text-white font-black text-xs uppercase tracking-wider hover:bg-black transition cursor-pointer"
          >
            Contactar Empresa
          </button>
        </div>
      </div>

      {/* PREGUNTAS FRECUENTES */}
      <div className="bg-white rounded-squircle-lg p-8 sm:p-10 shadow-xs border border-white/80 max-w-3xl mx-auto">
        <h3 className="text-xl font-black text-brand-obsidian mb-6 text-center">
          Preguntas Frecuentes
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-brand-bg/30">
            <h4 className="text-sm font-bold text-brand-obsidian mb-1">
              ¿El dinero de los pagos pasa por Stayhigh?
            </h4>
            <p className="text-xs text-brand-subtext leading-relaxed">
              No. El dinero viaja directamente desde la app de tu cliente a tu propia cuenta de Yape o Plin. Stayhigh únicamente realiza la conciliación y verificación técnica en tiempo real.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-bg/30">
            <h4 className="text-sm font-bold text-brand-obsidian mb-1">
              ¿Qué necesito para que funcione la verificación en &lt; 1 segundo?
            </h4>
            <p className="text-xs text-brand-subtext leading-relaxed">
              Solo necesitas un teléfono Android con la app de Yape/Plin instalada y nuestra aplicación ligera Stayhigh Listener, que lee las notificaciones bancarias oficiales y las notifica al servidor.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-bg/30">
            <h4 className="text-sm font-bold text-brand-obsidian mb-1">
              ¿Cómo evita Stayhigh los fraudes con capturas falsas?
            </h4>
            <p className="text-xs text-brand-subtext leading-relaxed">
              El cliente nunca envía una captura. La orden solo se marca como pagada si nuestro servidor detecta la notificación bancaria real que coincide con el monto exacto, la ventana de tiempo y el nombre del cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
