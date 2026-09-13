import React, { useState } from 'react';
import { CreatePrechargeDTO } from '../types/payment';
import { Loader2, ArrowRight, Info } from 'lucide-react';

interface PaymentFormProps {
  onSubmit: (data: CreatePrechargeDTO) => Promise<void>;
  isLoading: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, isLoading }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; amount?: string }>({});

  const validate = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string; amount?: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Los nombres son obligatorios y deben estar bien escritos.';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Los apellidos son obligatorios y deben estar bien escritos.';
    }

    if (!amount.trim()) {
      newErrors.amount = 'El monto es obligatorio.';
    } else {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = 'El monto debe ser un número mayor a 0.';
      } else {
        // Máximo 2 decimales
        const decimalParts = amount.split('.');
        if (decimalParts.length > 1 && decimalParts[1].length > 2) {
          newErrors.amount = 'El monto puede tener como máximo 2 decimales.';
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
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy">Crear nuevo cobro</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ingresa los datos para generar el código QR y enlace de pago.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Aviso de nombres correctos */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
          <span>
            <strong>Importante:</strong> Escribe los nombres y apellidos correctamente tal como figuran en la aplicación del cliente (Yape/Plin) para que el pago se confirme de forma automática.
          </span>
        </div>

        {/* Nombres (Línea 1) */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-semibold text-slate-700 mb-1">
            Nombres
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
            className={`w-full px-3.5 py-2.5 rounded-lg border text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition ${
              errors.firstName
                ? 'border-brand-red focus:ring-brand-red/30'
                : 'border-slate-300 focus:border-brand-blue focus:ring-brand-blue/20'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1.5 text-xs text-brand-red font-medium">{errors.firstName}</p>
          )}
        </div>

        {/* Apellidos (Línea 2) */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-semibold text-slate-700 mb-1">
            Apellidos
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
            className={`w-full px-3.5 py-2.5 rounded-lg border text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition ${
              errors.lastName
                ? 'border-brand-red focus:ring-brand-red/30'
                : 'border-slate-300 focus:border-brand-blue focus:ring-brand-blue/20'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1.5 text-xs text-brand-red font-medium">{errors.lastName}</p>
          )}
        </div>

        {/* Monto */}
        <div>
          <label htmlFor="expected_amount" className="block text-sm font-semibold text-slate-700 mb-1">
            Monto
          </label>
          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <span className="text-slate-500 font-semibold text-sm">S/</span>
            </div>
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
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-lg border text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition ${
                errors.amount
                  ? 'border-brand-red focus:ring-brand-red/30'
                  : 'border-slate-300 focus:border-brand-blue focus:ring-brand-blue/20'
              }`}
            />
          </div>
          {errors.amount && <p className="mt-1.5 text-xs text-brand-red font-medium">{errors.amount}</p>}
          <p className="mt-1 text-xs text-slate-400">Moneda predeterminada: Soles (PEN)</p>
        </div>

        {/* Descripción opcional */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1">
            Descripción opcional
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Consumo mesa 4, Pedido #1024"
            disabled={isLoading}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder-slate-400 text-sm focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:outline-none transition"
          />
        </div>

        {/* Botón GENERAR QR */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold text-sm bg-brand-blue hover:bg-brand-blue-hover focus:outline-none focus:ring-4 focus:ring-brand-blue/30 disabled:opacity-60 transition shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando precharge...</span>
              </>
            ) : (
              <>
                <span>GENERAR QR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
