import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { isMockMode } from '../services/api';

interface NavbarProps {
  onReset?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReset }) => {
  return (
    <header className="bg-navy border-b border-navy-light/40 shadow-sm text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-brand-blue rounded-md px-1 py-0.5 transition"
        >
          <div className="w-9 h-9 rounded-lg bg-brand-blue flex items-center justify-center font-bold text-white tracking-wider shadow-inner">
            SH
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block leading-tight">
              Stayhigh
            </span>
            <span className="text-xs text-blue-200 block">Payment Checkout</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {isMockMode ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 text-amber-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>MODO DEMO</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/20 border border-brand-green/40 text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRODUCCIÓN</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
