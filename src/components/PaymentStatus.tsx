import React from 'react';
import { PrechargeStatus } from '../types/payment';
import { CheckCircle2, Clock, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: PrechargeStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'MATCHED':
      return (
        <span
          className={`inline-flex items-center gap-2 font-black rounded-full bg-brand-mint text-brand-obsidian shadow-xs tracking-wide transition-all ${
            size === 'lg' ? 'px-5 py-2.5 text-sm' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
          }`}
        >
          <CheckCircle2 className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Pago confirmado</span>
        </span>
      );
    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-2 font-black rounded-full bg-rose-200 text-rose-950 shadow-xs tracking-wide ${
            size === 'lg' ? 'px-5 py-2.5 text-sm' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
          }`}
        >
          <XCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Cobro expirado</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-2 font-black rounded-full bg-slate-200 text-slate-700 shadow-xs tracking-wide ${
            size === 'lg' ? 'px-5 py-2.5 text-sm' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
          }`}
        >
          <AlertCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Cobro cancelado</span>
        </span>
      );
    case 'AMBIGUOUS':
      return (
        <span
          className={`inline-flex items-center gap-2 font-black rounded-full bg-amber-200 text-amber-950 shadow-xs tracking-wide ${
            size === 'lg' ? 'px-5 py-2.5 text-sm' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
          }`}
        >
          <AlertTriangle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Por verificar</span>
        </span>
      );
    case 'WAITING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-2 font-black rounded-full bg-brand-lavender text-brand-obsidian shadow-xs tracking-wide transition-all ${
            size === 'lg' ? 'px-5 py-2.5 text-sm' : size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-obsidian opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-obsidian"></span>
          </span>
          <Clock className={`animate-spin-slow ${size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-brand-obsidian`} />
          <span>Esperando pago...</span>
        </span>
      );
  }
};
