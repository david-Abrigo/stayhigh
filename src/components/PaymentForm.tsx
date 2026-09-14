import React, { useState, useEffect } from 'react';
import { CreatePrechargeDTO } from '../types/payment';
import { Loader2, ArrowUpRight, Lock, Store, ShieldCheck, Sparkles, MessageSquareQuote, Tag, Clock, AlertTriangle } from 'lucide-react';
import { MerchantConfig } from '../services/api';
import { PaymentGuide } from './PaymentGuide';

interface PaymentFormProps {
  onSubmit: (data: CreatePrechargeDTO) => Promise<void>;
  isLoading: boolean;
  merchantConfig?: MerchantConfig | null;
  initialAmount?: number;
  isAmountLocked?: boolean;
  initialDescription?: string;
  sellerMessage?: string;
  confirmationMessage?: string;
  concept?: string;
  linkExpiresAt?: string | null;
  targetCustomerName?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  isLoading,
  merchantConfig,
  initialAmount,
  isAmountLocked = false,
  sellerMessage,
  confirmationMessage,
  concept,
  linkExpiresAt,
  targetCustomerName,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [amount, setAmount] = useState(initialAmount ? initialAmount.toFixed(2) : '');
  const [buyerNote, setBuyerNote] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; amount?: string }>({});

  useEffect(() => {
    if (targetCustomerName && targetCustomerName.trim()) {
      const parts = targetCustomerName.trim().split(/\s+/);
      if (parts[0]) setFirstName(parts[0]);
      if (parts.length > 1) setLastName(parts.slice(1).join(' '));
    }
  }, [targetCustomerName]);

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean } | null>(null);

  useEffect(() => {
    if (initialAmount !== undefined) {
      setAmount(initialAmount.toFixed(2));
    }
  }, [initialAmount]);

  useEffect(() => {
    if (!linkExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const calcTime = () => {
      const diff = new Date(linkExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [linkExpiresAt]);

  const rawSellerMessage = sellerMessage || merchantConfig?.seller_message || merchantConfig?.welcome_message;
  const productDetails = concept || merchantConfig?.product_details;
  const effectiveSellerMessage = (rawSellerMessage && rawSellerMessage.trim().toLowerCase() !== productDetails?.trim().toLowerCase())
    ? rawSellerMessage
    : undefined;
  const effectiveConfirmationMessage = confirmationMessage || merchantConfig?.confirmation_message;

  const validate = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string; amount?: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Ingresa tus nombres tal como figuran en tu Yape.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Ingresa tus apellidos tal como figuran en tu Yape.';
    } else if (lastName.trim().length < 3) {
      newErrors.lastName = 'El apellido debe tener al menos 3 letras.';
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

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`;
    const firstWordName = trimmedFirst.split(/\s+/)[0] || '';
    const firstWordLast = trimmedLast.split(/\s+/)[0] || '';
    const yapeMasked = `${firstWordName} ${firstWordLast.substring(0, 3)}*`.toUpperCase();

    await onSubmit({
      expected_name: fullName,
      expected_amount: parseFloat(parseFloat(amount).toFixed(2)),
      currency: 'PEN',
      description: buyerNote.trim() || undefined,
      seller_message: effectiveSellerMessage || undefined,
      confirmation_message: effectiveConfirmationMessage || undefined,
      concept: productDetails || undefined,
      metadata: {
        first_name: trimmedFirst,
        last_name: trimmedLast,
        yape_masked_name: yapeMasked,
      },
    });
  };

  const numericAmount = parseFloat(amount) || initialAmount || 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-squircle-lg p-6 sm:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 transition-all">
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

      {/* Temporizador Maestro del Enlace (corre en el formulario y en el QR, incluso antes de abrirse) */}
      {timeLeft && (
        timeLeft.isExpired ? (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-center animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider">
              Esta oferta ha finalizado
            </h4>
            <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto">
              El tiempo para acceder a este precio u oferta especial ha terminado. Por favor comunícate con el comercio para solicitar un nuevo enlace.
            </p>
          </div>
        ) : (
          <div className={`mb-6 p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs transition-colors ${
            timeLeft.hours === 0 && timeLeft.minutes < 5
              ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
              : 'bg-brand-mint/30 border-brand-mint/70 text-brand-obsidian'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-obsidian text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-brand-mint" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black block leading-tight">
                  {timeLeft.hours === 0 && timeLeft.minutes < 5 ? '¡Esta oferta está por terminar!' : 'Esta oferta termina en:'}
                </span>
                <span className="text-[10px] text-brand-subtext block font-medium">
                  Este precio solo disponible en este tiempo
                </span>
              </div>
            </div>
            <div className="font-mono text-sm sm:text-base font-black bg-brand-obsidian text-white px-3 py-1.5 rounded-xl shadow-xs shrink-0 tracking-wider">
              {timeLeft.hours > 0 ? `${String(timeLeft.hours).padStart(2, '0')}:` : ''}
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        )
      )}

      {/* Banner del Mensaje del Vendedor si existe */}
      {effectiveSellerMessage && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-left shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <MessageSquareQuote className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">
              Mensaje del Vendedor
            </span>
            <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full ml-auto">
              Aviso del comercio
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-amber-950 whitespace-pre-line pl-1 leading-relaxed">
            {effectiveSellerMessage}
          </p>
        </div>
      )}

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

            {productDetails && (
              <div className="mt-3 pt-2.5 border-t border-brand-obsidian/15 flex items-start gap-2 text-left">
                <Tag className="w-3.5 h-3.5 text-brand-obsidian/80 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-obsidian/70 block">
                    Concepto / Pedido
                  </span>
                  <span className="text-xs font-bold text-brand-obsidian leading-snug">
                    {productDetails}
                  </span>
                </div>
              </div>
            )}
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

        {/* Aviso de coincidencia de titular en Yape */}
        <div className="p-3.5 rounded-2xl bg-brand-mint/25 border border-brand-mint-dark/20 text-left flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-mint-dark shrink-0 mt-0.5" />
          <p className="text-xs text-brand-obsidian leading-relaxed">
            <strong className="font-extrabold text-brand-obsidian">Requisito obligatorio:</strong> Escribe tus datos tal como aparecen en tu app Yape. La cuenta con la que pagues debe tener <strong>el mismo nombre</strong> a escribir en este formulario para validar tu cobro automáticamente.
          </p>
        </div>

        {/* Nombres del cliente */}
        <div>
          {targetCustomerName && (
            <div className="mb-2 p-2 px-3 rounded-xl bg-brand-obsidian/5 border border-brand-border flex items-center justify-between text-xs">
              <span className="font-bold text-brand-obsidian flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-mint" />
                Destinatario exclusivo:
              </span>
              <span className="font-mono font-black text-brand-obsidian">{targetCustomerName}</span>
            </div>
          )}
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

        {/* Nota opcional del comprador */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="buyer_note" className="block text-xs font-bold uppercase tracking-wider text-brand-subtext">
              Nota o referencia de tu compra (Opcional)
            </label>
            <span className="text-[10px] font-semibold text-brand-subtext">Para el comercio</span>
          </div>
          <input
            id="buyer_note"
            type="text"
            value={buyerNote}
            onChange={(e) => setBuyerNote(e.target.value)}
            placeholder="Ej. Departamento 402, o sin mayonesa"
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-xl border border-brand-border text-sm font-medium text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:border-brand-obsidian focus:outline-none focus:ring-2 focus:ring-brand-obsidian/10 transition"
          />
        </div>

        {/* Botón de Acción Principal */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || Boolean(timeLeft?.isExpired)}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-white font-bold text-sm bg-brand-obsidian hover:bg-black focus:outline-none focus:ring-4 focus:ring-brand-obsidian/20 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm active:scale-[0.99] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-mint" />
                <span>Generando orden...</span>
              </>
            ) : timeLeft?.isExpired ? (
              <span>ENLACE DE COBRO VENCIDO</span>
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

      {numericAmount > 0 && (
        <PaymentGuide
          mode="form"
          expectedAmount={numericAmount}
          merchantTag={merchantConfig?.merchant_tag}
        />
      )}
    </div>
  );
};
