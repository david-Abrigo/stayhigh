import React, { useState } from 'react';
import { ShieldCheck, Zap, ArrowUpRight, Menu, X, Lock } from 'lucide-react';
import { isMockMode } from '../services/api';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onReset?: () => void;
  minimal?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath = '/',
  onNavigate,
  onReset,
  minimal = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    if (minimal) return; // In minimal checkout mode, keep user focused on payment
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else if (onReset) {
      onReset();
    }
  };

  const navItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Precios', path: '/precios' },
    { label: 'API & Docs', path: '/api' },
  ];

  return (
    <header className="pt-4 px-4 sm:px-6 max-w-5xl mx-auto w-full relative z-50">
      <div className="bg-white/90 backdrop-blur-md border border-white/70 shadow-[0_4px_25px_rgba(0,0,0,0.03)] rounded-2xl px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between transition">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-brand-obsidian text-brand-mint flex items-center justify-center font-black text-sm tracking-wider shadow-sm">
            SH
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight text-brand-obsidian leading-tight">
                Stayhigh
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-brand-mint"></span>
            </div>
            <span className="text-[10px] font-bold text-brand-subtext block uppercase tracking-wider">
              {minimal ? 'Checkout Seguro' : 'Smart Checkout'}
            </span>
          </div>
        </div>

        {/* If minimal: ONLY show secure payment badge on the right, NO navigation links */}
        {minimal ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-mint text-brand-obsidian text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-mint-dark animate-pulse"></span>
              <Lock className="w-3.5 h-3.5 text-brand-obsidian" />
              <span>Pago Seguro</span>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Navigation Links (Only for main site) */}
            <nav className="hidden md:flex items-center gap-1 bg-black/[0.03] p-1.5 rounded-2xl">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => handleNav(item.path)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-white text-brand-obsidian shadow-xs'
                        : 'text-brand-subtext hover:text-brand-obsidian hover:bg-white/50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right CTA / Status & Demo button */}
            <div className="hidden sm:flex items-center gap-3">
              {isMockMode ? (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-lavender/30 border border-brand-lavender/50 text-brand-obsidian text-xs font-semibold">
                  <Zap className="w-3.5 h-3.5 text-brand-lavender-dark" />
                  <span>Simulación</span>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-mint text-brand-obsidian text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-brand-mint-dark animate-pulse"></span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>En vivo</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleNav('/demo')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-obsidian text-white text-xs font-black uppercase tracking-wider hover:bg-black transition shadow-xs group cursor-pointer"
              >
                <span>Probar Demo</span>
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-brand-mint group-hover:text-brand-obsidian transition">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => handleNav('/demo')}
                className="px-3 py-2 rounded-xl bg-brand-obsidian text-white text-xs font-bold cursor-pointer"
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-brand-obsidian hover:bg-gray-100 transition focus:outline-none cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Drawer (Only for non-minimal) */}
      {!minimal && mobileMenuOpen && (
        <div className="sm:hidden mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 p-4 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-brand-mint text-brand-obsidian'
                    : 'text-brand-subtext hover:text-brand-obsidian hover:bg-gray-50'
                }`}
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-4 h-4 text-brand-subtext/60" />
              </button>
            );
          })}

          <div className="pt-2 border-t border-black/[0.06]">
            <button
              type="button"
              onClick={() => handleNav('/demo')}
              className="w-full py-3.5 px-4 rounded-xl bg-brand-obsidian text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>Probar Demo Checkout</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
