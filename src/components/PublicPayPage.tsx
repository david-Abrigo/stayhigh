import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Precharge } from '../types/payment';
import { getPrechargeByPublicId, getMerchantConfig, MerchantConfig } from '../services/api';
import { usePrechargeRealtime } from '../hooks/usePrechargeRealtime';
import { PaymentStatusBadge } from './PaymentStatus';
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface PublicPayPageProps {
  publicId: string;
}

export const PublicPayPage: React.FC<PublicPayPageProps> = ({ publicId }) => {
  const [initialData, setInitialData] = useState<Precharge | null>(null);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getPrechargeByPublicId(publicId);
        if (mounted) {
          if (data) {
            setInitialData(data);
            const config = await getMerchantConfig(data.device_id || undefined);
            if (config && mounted) {
              setMerchantConfig(config);
            }
          } else {
            setError(`No se encontró la solicitud de cobro con referencia ${publicId}`);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Error cargando la solicitud de pago';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [publicId]);

  const { precharge, status, isConnected, isMockMode, simulateStatus } = usePrechargeRealtime(initialData);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
        <p className="text-sm font-medium text-slate-500">Cargando información del pago...</p>
      </div>
    );
  }

  if (error || !precharge) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-brand-red flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Solicitud no disponible</h3>
        <p className="text-sm text-slate-500 mt-2">{error || 'El cobro solicitado no existe o ya no es válido.'}</p>
        <a
          href="/"
          className="mt-5 inline-block px-4 py-2 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-light transition"
        >
          Ir al inicio
        </a>
      </div>
    );
  }

  const isMatched = status === 'MATCHED';
  const currentUrl = window.location.href;

  return (
    <div className="max-w-md mx-auto my-8 px-4">
      <div className="bg-white border border-slate-200 shadow-md rounded-2xl overflow-hidden">
        {/* Cabecera de la solicitud */}
        <div className="bg-navy p-6 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Stayhigh Checkout Seguro
          </div>
          <h1 className="text-lg font-medium text-blue-100">Solicitud de pago</h1>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1">
            S/ {precharge.expected_amount.toFixed(2)}
          </div>
          <p className="text-sm text-blue-200 mt-1">{precharge.expected_name}</p>
          {precharge.description && (
            <p className="text-xs text-blue-300/80 mt-1">{precharge.description}</p>
          )}
        </div>

        {/* Cuerpo */}
        <div className="p-6 text-center space-y-6">
          {/* Referencia */}
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Referencia
            </span>
            <span className="inline-block font-mono text-base font-bold text-navy px-3 py-1 rounded-md bg-slate-100 border border-slate-200">
              {precharge.public_id}
            </span>
          </div>

          {/* Banner de Estado o QR */}
          {isMatched ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-300 text-center">
              <div className="w-14 h-14 bg-brand-green text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-brand-green tracking-wide">PAGO CONFIRMADO</h2>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                Se ha recibido el pago de S/ {precharge.expected_amount.toFixed(2)}
              </p>
              {precharge.matched_at && (
                <p className="text-xs text-slate-400 mt-2">
                  Fecha: {new Date(precharge.matched_at).toLocaleString('es-PE')}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Etiqueta del Titular (Verificación en Yape/Plin) */}
              {merchantConfig?.merchant_tag && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                  <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase block">
                    Titular en Yape / Plin
                  </span>
                  <span className="text-lg font-black text-navy tracking-wide block mt-0.5">
                    {merchantConfig.merchant_tag}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Verifica este nombre antes de transferir
                  </span>
                </div>
              )}

              {/* Imagen del QR: Foto Estática o Fallback dinámico */}
              <div className="flex flex-col items-center justify-center">
                {merchantConfig?.qr_image_url ? (
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
                    <img
                      src={merchantConfig.qr_image_url}
                      alt="QR de Pago Yape / Plin"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="inline-flex p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <QRCodeSVG
                      value={currentUrl}
                      size={200}
                      level="M"
                      includeMargin={false}
                      className="w-48 h-48"
                    />
                  </div>
                )}
              </div>

              {/* Estado actual */}
              <div>
                <PaymentStatusBadge status={status} size="lg" />
              </div>
            </>
          )}

          {/* Indicador de actualización en tiempo real */}
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
            {isMockMode ? (
              <span>Modo simulación activo</span>
            ) : isConnected ? (
              <span>Sincronización en vivo activa (Realtime)</span>
            ) : (
              <span>Conectando con el servicio de pagos...</span>
            )}
          </div>
        </div>
      </div>

      {/* DEV MODE Controls for testing /pay/:publicId */}
      {isMockMode && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-2">
            DEV MODE (Simulación de eventos)
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => simulateStatus('MATCHED')}
              type="button"
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-brand-green text-white hover:bg-emerald-700 transition"
            >
              Simular pago
            </button>
            <button
              onClick={() => simulateStatus('EXPIRED')}
              type="button"
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-brand-red text-white hover:bg-red-700 transition"
            >
              Simular expiración
            </button>
            <button
              onClick={() => simulateStatus('AMBIGUOUS')}
              type="button"
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-brand-yellow text-white hover:bg-amber-700 transition"
            >
              Simular ambiguo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
