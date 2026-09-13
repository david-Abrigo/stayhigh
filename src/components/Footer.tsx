import React from 'react';
import { ShieldCheck, ArrowUpRight, Zap, Code2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-20 border-t border-black/[0.06] bg-white/60 backdrop-blur-md pt-12 pb-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-obsidian text-brand-mint flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
                SH
              </div>
              <span className="text-xl font-black tracking-tight text-brand-obsidian">
                Stayhigh
              </span>
              <span className="w-2 h-2 rounded-full bg-brand-mint"></span>
            </div>
            <p className="text-xs sm:text-sm text-brand-subtext leading-relaxed mb-4">
              La infraestructura de pagos en tiempo real para Perú. Concilia Yape y Plin en menos de 1 segundo sin comisiones de pasarela.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sistemas 100% operativos</span>
            </div>
          </div>

          {/* Col 1: Producto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-obsidian mb-3">
              Producto
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-brand-subtext font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/demo')}
                  className="hover:text-brand-obsidian transition text-left flex items-center gap-1 cursor-pointer"
                >
                  <span>Probar Demo Checkout</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-mint-dark" />
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Conciliación Yape & Plin
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/precios')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Enlaces de Cobro (/l/)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/demo')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Códigos QR Dinámicos
                </button>
              </li>
            </ul>
          </div>

          {/* Col 2: Desarrolladores */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-obsidian mb-3">
              Desarrolladores
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-brand-subtext font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/api')}
                  className="hover:text-brand-obsidian transition text-left flex items-center gap-1 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-brand-lavender-dark" />
                  <span>Documentación API</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/api')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Endpoints REST
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/api')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Webhooks en Tiempo Real
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/api')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Integración APK Android
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Empresa */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-obsidian mb-3">
              Plataforma
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-brand-subtext font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/precios')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Planes & Tarifas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/precios')}
                  className="hover:text-brand-obsidian transition text-left cursor-pointer"
                >
                  Calculadora de Ahorro
                </button>
              </li>
              <li>
                <span className="text-brand-subtext/70 cursor-default">
                  Seguridad HMAC SHA-256
                </span>
              </li>
              <li>
                <span className="text-brand-subtext/70 cursor-default">
                  Supabase Realtime Powered
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-subtext">
          <p>© {new Date().getFullYear()} Stayhigh. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Desarrollado para comercios y startups en Perú</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
