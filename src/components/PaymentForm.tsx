import React, { useState, useEffect } from 'react';
import { CreatePrechargeDTO } from '../types/payment';
import { Loader2, ArrowUpRight, Lock, Store, ShieldCheck, Sparkles } from 'lucide-react';
import { MerchantConfig } from '../services/api';

interface PaymentFormProps {
  onSubmit: (data: CreatePrechargeDTO) => Promise<void>;
  isLoading: boolean;
  merchantConfig?: MerchantConfig | null;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, isLoading, merchantConfig }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [amount, setAmount] = useState('');
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; amount?: string }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paramAmount = params.get('amount') || params.get('monto');
    const paramDesc = params.get('desc') || params.get('descripcion');

    if (paramAmount) {
      const parsed = parseFloat(paramAmount);
      if (!isNaN(parsed) && parsed > 0) {
        setAmount(parsed.toFixed(2));
        setIsAmountLocked(true);
      }
    }

    if (paramDesc) {
      setDescription(paramDesc);
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string; amount?: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Ingresa tus nombres tal como figuran en tu Yape.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Ingresa tus apellidos tal como figuran en tu Yape.';
    }

    if (!amount.trim()) {
      newErrors.amount = 'El monto es obligatorio.';
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'El monto debe ser un número mayor a 0.';
      } else {
        const decimalParts = amount.split('.');
        if (decimalParts.length > 1 && decimalParts[1].length > 2) {
          newErrors.amount = 'Máximo 2 decimales.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    await onSubmit({
      expected_name: fullName,
      expected_amount: parseFloat(parseFloat(amount).toFixed(2)),
      currency: 'PEN',
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="bg-white rounded-squircle-lg p-6 sm:p-9 max-w-lg mx-auto shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 transition-all">
      {/* Cabecera del Comercio (Estilo tarjeta obsidian o tarjeta suave) */}
      <div className="mb-6 p-4 rounded-2xl bg-brand-obsidian text-white flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-brand-mint shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Comercio
            </span>
            <span className="text-sm sm:text-base font-bold text-white leading-tight">
              {merchantConfig?.merchant_name || 'Stayhigh Checkout'}
            </span>
          </div>
        </div>

        {merchantConfig?.merchant_tag && (
          <div className="text-right">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Titular Yape
            </span>
            <span className="inline-block bg-brand-lavender text-brand-obsidian font-black text-xs px-2.5 py-0.5 rounded-full mt-0.5 shadow-xs">
              {merchantConfig.merchant_tag}
            </span>
          </div>
        )}
      </div>

      {/* Título de la sección */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-brand-obsidian tracking-tight">
          Pagar con Yape / Plin
        </h2>
        <p className="text-xs sm:text-sm text-brand-subtext mt-1">
          {isAmountLocked
            ? 'Ingresa tus datos de Yape para validar tu pago automáticamente.'
            : 'Define el monto y tus datos para generar tu orden de pago.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Tarjeta de Monto a Pagar (Inspirada en el bloque verde de la referencia) */}
        {isAmountLocked ? (
          <div className="p-5 rounded-2xl bg-brand-mint text-brand-obsidian shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-obsidian/70 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Monto a pagar
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-obsidian/10 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3" />
                Monto fijado
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
              S/ {parseFloat(amount).toFixed(2)}
            </div>
            <span className="text-[11px] font-medium text-brand-obsidian/60 mt-1 block">
              Moneda: Soles (PEN)
            </span>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-brand-muted border border-brand-border/60">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="expected_amount" className="block text-xs font-bold uppercase tracking-wider text-brand-subtext">
                Monto a transferir (S/)
              </label>
              <span className="text-[11px] font-semibold text-brand-subtext">Soles PEN</span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-obsidian font-black text-xl">
                S/
              </span>
              <input
                id="expected_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                placeholder="0.00"
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-3 rounded-xl font-black text-2xl text-brand-obsidian bg-white border placeholder-slate-300 focus:outline-none focus:ring-2 transition ${
                  errors.amount
                    ? 'border-brand-red focus:ring-brand-red/30'
                    : 'border-brand-border focus:border-brand-obsidian focus:ring-brand-obsidian/10'
                }`}
              />
            </div>
            {errors.amount && <p className="mt-1.5 text-xs text-brand-red font-semibold">{errors.amount}</p>}
          </div>
        )}

        {/* Nombres del cliente */}
        <div>
          <label htmlFor="first_name" className="block text-xs font-bold uppercase tracking-wider text-brand-subtext mb-1.5">
            Nombres en tu Yape / Plin
          </label>
          <input
            id="first_name"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
            }}
            placeholder="Ej. Juan Carlos"
            disabled={isLoading}
            className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:outline-none focus:ring-2 transition ${
              errors.firstName
                ? 'border-brand-red focus:ring-brand-red/30'
                : 'border-brand-border focus:border-brand-obsidian focus:ring-brand-obsidian/10'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-brand-red font-medium">{errors.firstName}</p>
          )}
        </div>

        {/* Apellidos del cliente */}
        <div>
          <label htmlFor="last_name" className="block text-xs font-bold uppercase tracking-wider text-brand-subtext mb-1.5">
            Apellidos en tu Yape / Plin
          </label>
          <input
            id="last_name"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
            }}
            placeholder="Ej. Pérez García"
            disabled={isLoading}
            className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:outline-none focus:ring-2 transition ${
              errors.lastName
                ? 'border-brand-red focus:ring-brand-red/30'
                : 'border-brand-border focus:border-brand-obsidian focus:ring-brand-obsidian/10'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-brand-red font-medium">{errors.lastName}</p>
          )}
        </div>

        {/* Descripción opcional */}
        <div>
          <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-brand-subtext mb-1.5">
            Nota o Pedido (Opcional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Mesa 4, Pedido #102"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm font-medium text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:border-brand-obsidian focus:outline-none focus:ring-2 focus:ring-brand-obsidian/10 transition"
          />
        </div>

        {/* Botón de Acción Principal */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-white font-bold text-sm bg-brand-obsidian hover:bg-black focus:outline-none focus:ring-4 focus:ring-brand-obsidian/20 disabled:opacity-60 transition shadow-sm active:scale-[0.99]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-mint" />
                <span>Generando orden...</span>
              </>
            ) : (
              <>
                <span>CONTINUAR AL PAGO</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-mint" />
                </div>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-brand-subtext pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-mint-dark" />
          <span>Confirmación instantánea en menos de 1 segundo</span>
        </div>
      </form>
    </div>
  );
};
