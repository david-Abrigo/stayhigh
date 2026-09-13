import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { isMockMode } from '../services/api';

interface NavbarProps {
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset }) => {
  return (
    <header className="pt-4 px-4 sm:px-6 max-w-4xl mx-auto w-full">
      <div className="bg-white/90 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] rounded-2xl px-4 sm:px-5 h-16 flex items-center justify-between transition">
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-mint rounded-xl px-1 py-1 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-obsidian text-brand-mint flex items-center justify-center font-black text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            SH
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-brand-obsidian leading-tight">
                Stayhigh
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-mint"></span>
            </div>
            <span className="text-[11px] font-medium text-brand-subtext block">
              Smart Checkout
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          {isMockMode ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-lavender/30 border border-brand-lavender/50 text-brand-obsidian text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-brand-lavender-dark" />
              <span>Simulación</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-mint text-brand-obsidian text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-mint-dark animate-pulse"></span>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>En vivo</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
