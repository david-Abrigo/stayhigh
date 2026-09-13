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
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-brand-mint text-brand-obsidian shadow-xs ${
            size === 'lg' ? 'px-4 py-2 text-sm' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Pago confirmado</span>
        </span>
      );
    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-100 text-rose-800 ${
            size === 'lg' ? 'px-4 py-2 text-sm' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          }`}
        >
          <XCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Cobro expirado</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-slate-200 text-slate-700 ${
            size === 'lg' ? 'px-4 py-2 text-sm' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          }`}
        >
          <AlertCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Cobro cancelado</span>
        </span>
      );
    case 'AMBIGUOUS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-100 text-amber-900 ${
            size === 'lg' ? 'px-4 py-2 text-sm' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs'
          }`}
        >
          <AlertTriangle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Pendiente de verificación</span>
        </span>
      );
    case 'WAITING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-brand-lavender/30 text-brand-obsidian border border-brand-lavender/40 ${
            size === 'lg' ? 'px-4 py-2 text-sm' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3.5 py-1 text-xs'
          }`}
        >
          <Clock className={`animate-spin-slow ${size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-brand-lavender-dark`} />
          <span>Esperando pago</span>
        </span>
      );
  }
};
