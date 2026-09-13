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
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-emerald-50 text-[#16A34A] border-emerald-300 ${
            size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          }`}
        >
          <CheckCircle2 className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>Pago confirmado</span>
        </span>
      );
    case 'EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-red-50 text-[#DC2626] border-red-300 ${
            size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          }`}
        >
          <XCircle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>Cobro expirado</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-slate-100 text-slate-700 border-slate-300 ${
            size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          }`}
        >
          <AlertCircle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>Cobro cancelado</span>
        </span>
      );
    case 'AMBIGUOUS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-amber-50 text-[#D97706] border-amber-300 ${
            size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          }`}
        >
          <AlertTriangle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>Pago pendiente de revisión</span>
        </span>
      );
    case 'WAITING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-blue-50 text-[#2563EB] border-blue-200 ${
            size === 'lg' ? 'px-4 py-2 text-base' : size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
          }`}
        >
          <Clock className={`animate-spin-slow ${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
          <span>Esperando pago</span>
        </span>
      );
  }
};
