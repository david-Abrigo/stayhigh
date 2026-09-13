import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface PaymentGuideProps {
  expectedAmount: number;
  merchantTag?: string | null;
  mode?: 'form' | 'qr';
}

export const PaymentGuide: React.FC<PaymentGuideProps> = ({
  expectedAmount,
  merchantTag,
  mode = 'qr',
}) => {
  const isFormMode = mode === 'form';
  return (
    <div className="bg-white rounded-squircle-lg p-6 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 text-left transition-all">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Columna Izquierda: Línea de Tiempo / Pasos */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-brand-mint text-brand-obsidian flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-brand-obsidian tracking-tight leading-tight">
                Guía de pago
              </h3>
              <p className="text-[11px] font-medium text-brand-subtext">
                Instrucciones de validación
              </p>
            </div>
          </div>

          <div className="relative pl-5 space-y-4">
            {/* Línea conectora vertical */}
            <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />

            {/* Paso 1 */}
            <div className="relative flex items-start gap-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-white relative z-10 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-brand-obsidian leading-snug">
                  {isFormMode ? '1. Escribe tu nombre tal como figura en Yape' : '1. Escanea el código QR'}
                </span>
                <span className="block text-[11px] text-brand-subtext leading-relaxed">
                  {isFormMode
                    ? 'Escribe tus nombres y apellidos exactamente como aparecen registrados en tu cuenta Yape.'
                    : 'Abre tu app Yape o Plin y escanea la imagen.'}
                </span>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative flex items-start gap-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-white relative z-10 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-brand-obsidian leading-snug">
                  {isFormMode ? '2. El Yape a pagar debe ser el mismo nombre' : '2. Digita el monto exacto'}
                </span>
                <span className="block text-[11px] text-brand-subtext leading-relaxed mt-0.5">
                  {isFormMode ? (
                    'La transferencia debe realizarse desde el mismo Yape del titular indicado en el formulario.'
                  ) : (
                    <>
                      Digita exactamente{' '}
                      <span className="font-black text-brand-obsidian bg-brand-mint/60 px-2 py-0.5 rounded-full inline-block">
                        S/ {expectedAmount.toFixed(2)}
                      </span>{' '}
                      sin redondear.
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative flex items-start gap-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 bg-white relative z-10 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-brand-obsidian leading-snug">
                  {isFormMode ? '3. Digita el monto exacto' : '3. Verifica el titular'}
                </span>
                <span className="block text-[11px] text-brand-subtext leading-relaxed mt-0.5">
                  {isFormMode ? (
                    <>
                      Deberás transferir exactamente{' '}
                      <span className="font-black text-brand-obsidian bg-brand-mint/60 px-2 py-0.5 rounded-full inline-block">
                        S/ {expectedAmount.toFixed(2)}
                      </span>{' '}
                      sin redondear ni omitir céntimos.
                    </>
                  ) : merchantTag ? (
                    <>
                      Titular en Yape:{' '}
                      <span className="font-black text-brand-obsidian bg-brand-lavender px-2 py-0.5 rounded-full inline-block">
                        {merchantTag}
                      </span>
                    </>
                  ) : (
                    'Verifica el nombre del comercio.'
                  )}
                </span>
              </div>
            </div>

            {/* Paso 4 (Punto oscuro final) */}
            <div className="relative flex items-start gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-brand-obsidian relative z-10 shrink-0 mt-0.5" />
              <div>
                <span className="block text-xs font-bold text-brand-obsidian leading-snug">
                  4. Confirmación automática
                </span>
                <span className="block text-[11px] text-brand-subtext leading-relaxed">
                  {isFormMode
                    ? 'Al pulsar "Continuar al pago", verás el QR y se validará en menos de 1 segundo.'
                    : 'La pantalla cambiará sin necesidad de recargar.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Verde Menta y Tarjeta Lavanda */}
        <div className="space-y-4">
          {/* Tarjeta 1: Verde Menta */}
          <div className="bg-brand-mint text-brand-obsidian rounded-2xl sm:rounded-3xl p-5 shadow-xs flex flex-col justify-between min-h-[125px] transition-transform hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-obsidian/75">
                {isFormMode ? 'Titular en tu Yape' : 'Monto exacto'}
              </span>
              <div className="w-6 h-6 rounded-full bg-brand-obsidian/10 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-brand-obsidian" />
              </div>
            </div>

            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight block">
                {isFormMode ? 'Mismo Nombre' : `S/ ${expectedAmount.toFixed(2)}`}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-brand-obsidian/10 text-[10px] font-bold text-brand-obsidian/70">
              <span className="bg-brand-obsidian/10 px-2 py-0.5 rounded-full">
                Requisito obligatorio
              </span>
              <span>{isFormMode ? 'Yape = Formulario' : 'Sin alterar céntimos'}</span>
            </div>
          </div>

          {/* Tarjeta 2: Lavanda (Tiempo de Validación) */}
          <div className="bg-brand-lavender text-brand-obsidian rounded-2xl sm:rounded-3xl p-5 shadow-xs flex flex-col justify-between min-h-[125px] transition-transform hover:scale-[1.01]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-obsidian/75">
                Validación en vivo
              </span>
              <div className="w-6 h-6 rounded-full bg-brand-obsidian/10 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-brand-obsidian" />
              </div>
            </div>

            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight block">
                {'< 1 segundo'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-brand-obsidian/10 text-[10px] font-bold text-brand-obsidian/70">
              <span className="bg-brand-obsidian/10 px-2 py-0.5 rounded-full">
                Realtime activo
              </span>
              <span>Detección instantánea</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
