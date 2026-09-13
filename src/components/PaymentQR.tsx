import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Precharge, PrechargeStatus } from '../types/payment';
import { PaymentStatusBadge } from './PaymentStatus';
import { getMerchantConfig, MerchantConfig } from '../services/api';
import { Copy, Check, PlusCircle, ExternalLink, Radio, CheckCircle2, QrCode } from 'lucide-react';

interface PaymentQRProps {
  precharge: Precharge;
  status: PrechargeStatus;
  isConnected: boolean;
  isMockMode: boolean;
  onNewPrecharge: () => void;
  onSimulateStatus: (status: PrechargeStatus) => void;
}

export const PaymentQR: React.FC<PaymentQRProps> = ({
  precharge,
  status,
  isConnected,
  isMockMode,
  onNewPrecharge,
  onSimulateStatus,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);

  const publicBaseUrl = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
  const payUrl = `${publicBaseUrl}/pay/${precharge.public_id}`;

  useEffect(() => {
    getMerchantConfig().then((cfg) => {
      if (cfg) setMerchantConfig(cfg);
    });
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(precharge.public_id);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const isMatched = status === 'MATCHED';

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Tarjeta Principal */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 sm:p-8 text-center">
        {/* Banner de Pago Confirmado */}
        {isMatched ? (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center animate-fade-in">
            <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-brand-green tracking-wide">PAGO CONFIRMADO</h3>
            <p className="text-2xl font-black text-slate-800 mt-1">
              S/ {precharge.expected_amount.toFixed(2)}
            </p>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">{precharge.expected_name}</p>
            {precharge.matched_at && (
              <p className="text-xs text-slate-400 mt-2">
                Confirmado el: {new Date(precharge.matched_at).toLocaleTimeString('es-PE')}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Cobro en espera
            </span>
            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-black text-navy">
                S/ {precharge.expected_amount.toFixed(2)}
              </span>
            </div>
            <p className="text-base font-semibold text-slate-700 mt-1">{precharge.expected_name}</p>
            {precharge.description && (
              <p className="text-xs text-slate-400 mt-0.5">{precharge.description}</p>
            )}
          </div>
        )}

        {/* Etiqueta del Titular (Verificación en Yape/Plin) */}
        {merchantConfig?.merchant_tag && (
          <div className="my-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
            <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase block">
              Titular en Yape / Plin
            </span>
            <span className="text-lg font-black text-navy tracking-wide block mt-0.5">
              {merchantConfig.merchant_tag}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Verifica que este nombre coincida antes de transferir
            </span>
          </div>
        )}

        {/* Imagen del QR: Foto Estática o Fallback dinámico */}
        <div className="my-5 flex flex-col items-center justify-center">
          {merchantConfig?.qr_image_url ? (
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
              <img
                src={merchantConfig.qr_image_url}
                alt="QR de Pago Yape / Plin"
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm inline-block">
              <QRCodeSVG
                value={payUrl}
                size={210}
                level="M"
                includeMargin={false}
                className="w-48 h-48 sm:w-52 sm:h-52"
              />
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <QrCode className="w-3 h-3" />
                <span>Foto de QR configurable desde app Android</span>
              </div>
            </div>
          )}
        </div>

        {/* Código de Operación */}
        <div className="mb-5">
          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">
            Código de operación
          </span>
          <span className="inline-block font-mono text-lg font-bold text-navy px-3 py-1 rounded bg-slate-100 border border-slate-200">
            {precharge.public_id}
          </span>
        </div>

        {/* Estado */}
        <div className="mb-6 pt-3 border-t border-slate-100">
          <span className="block text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Estado
          </span>
          <div className="flex items-center justify-center">
            <PaymentStatusBadge status={status} size="lg" />
          </div>

          {/* Indicador de conexión Realtime */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-brand-green' : 'text-slate-300'}`} />
            <span>
              {isMockMode
                ? 'Modo simulación activo'
                : isConnected
                ? 'Sincronizado con Supabase Realtime'
                : 'Conectando a Realtime...'}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleCopyCode}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-brand-green" />
                <span className="text-brand-green font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar código</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-brand-green" />
                <span className="text-brand-green font-semibold">Enlace copiado</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={onNewPrecharge}
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo cobro</span>
          </button>
        </div>
      </div>

      {/* DEV MODE Controls */}
      {isMockMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              DEV MODE (Simulación)
            </span>
            <span className="text-xs text-amber-700">Solo visible en VITE_MOCK_MODE=true</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <button
              onClick={() => onSimulateStatus('MATCHED')}
              type="button"
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-green text-white hover:bg-emerald-700 transition"
            >
              Simular pago
            </button>
            <button
              onClick={() => onSimulateStatus('EXPIRED')}
              type="button"
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-red text-white hover:bg-red-700 transition"
            >
              Simular expiración
            </button>
            <button
              onClick={() => onSimulateStatus('AMBIGUOUS')}
              type="button"
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-yellow text-white hover:bg-amber-700 transition"
            >
              Simular pago ambiguo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
