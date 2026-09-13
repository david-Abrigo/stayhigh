import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Precharge, PrechargeStatus } from '../types/payment';
import { PaymentStatusBadge } from './PaymentStatus';
import { getMerchantConfig, MerchantConfig } from '../services/api';
import { Copy, Check, PlusCircle, ExternalLink, Radio, CheckCircle2, QrCode } from 'lucide-react';
import { PaymentGuide } from './PaymentGuide';
import { PaymentSuccessScreen } from './PaymentSuccessScreen';

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
    getMerchantConfig(precharge.device_id || undefined).then((cfg) => {
      if (cfg) setMerchantConfig(cfg);
    });
  }, [precharge.device_id]);

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

  if (isMatched) {
    return (
      <div className="space-y-4">
        <PaymentSuccessScreen
          precharge={precharge}
          merchantConfig={merchantConfig}
          onReset={onNewPrecharge}
          isMerchantView={true}
        />

        {/* DEV MODE Controls */}
        {isMockMode && (
          <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm text-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                DEV MODE (Simulación)
              </span>
              <span className="text-xs text-amber-700">Cambiar estado del cobro</span>
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => onSimulateStatus('WAITING')}
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-obsidian text-white hover:bg-black transition"
              >
                Volver a Esperando
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Tarjeta Principal */}
      <div className="bg-white rounded-squircle-lg p-6 sm:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 text-center transition-all">
        {/* Banner de Cobro en Espera */}
        <div className="mb-5 p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-brand-obsidian text-white text-center shadow-xs">
          <span className="inline-block text-[11px] font-black tracking-wider text-brand-obsidian uppercase bg-brand-mint px-3.5 py-1 rounded-full mb-2 shadow-2xs">
            Cobro en espera
          </span>
          <div className="mt-1">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              S/ {precharge.expected_amount.toFixed(2)}
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-200 mt-2">{precharge.expected_name}</p>

          {/* Aviso previo del vendedor si existe */}
          {(precharge.seller_message || precharge.metadata?.seller_message || merchantConfig?.seller_message || merchantConfig?.welcome_message) && (
            <div className="mt-3 p-3 bg-white/10 rounded-2xl text-left border border-white/10">
              <span className="text-[10px] font-bold text-brand-mint uppercase tracking-wider block">
                Aviso del comercio
              </span>
              <p className="text-xs text-slate-200 font-medium whitespace-pre-line mt-0.5">
                {precharge.seller_message || precharge.metadata?.seller_message || merchantConfig?.seller_message || merchantConfig?.welcome_message}
              </p>
            </div>
          )}

          {/* Concepto o producto de la orden o tienda si existe */}
          {(precharge.metadata?.concept || precharge.concept || merchantConfig?.product_details) && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-xs font-semibold text-slate-200">
              <span className="text-brand-mint font-bold">Concepto:</span>
              <span>{(precharge.metadata?.concept as string) || precharge.concept || merchantConfig?.product_details}</span>
            </div>
          )}

          {/* Nota opcional del comprador si existe */}
          {precharge.description && (
            <p className="text-xs font-medium text-slate-400 mt-2 italic">
              Nota del cliente: "{precharge.description}"
            </p>
          )}
        </div>

        {/* Etiqueta del Titular (Verificación en Yape/Plin) */}
        {merchantConfig?.merchant_tag && (
          <div className="my-5 p-4 sm:p-5 bg-brand-lavender text-brand-obsidian rounded-2xl sm:rounded-3xl text-center shadow-xs transition-transform hover:scale-[1.01]">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-brand-obsidian/75 bg-brand-obsidian/10 px-3 py-1 rounded-full mb-1.5">
              Titular en Yape / Plin
            </span>
            <span className="text-xl sm:text-2xl font-black text-brand-obsidian tracking-tight block">
              {merchantConfig.merchant_tag}
            </span>
            <span className="text-xs font-semibold text-brand-obsidian/70 block mt-1">
              Verifica que este nombre coincida antes de transferir
            </span>
          </div>
        )}

        {/* Imagen del QR: Foto Estática o Fallback dinámico */}
        <div className="my-5 flex flex-col items-center justify-center">
          {merchantConfig?.qr_image_url ? (
            <div className="p-3.5 bg-brand-muted border border-brand-border rounded-2xl sm:rounded-3xl shadow-xs inline-block">
              <img
                src={merchantConfig.qr_image_url}
                alt="QR de Pago Yape / Plin"
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="p-4 bg-brand-muted border border-brand-border rounded-2xl sm:rounded-3xl shadow-xs inline-block">
              <QRCodeSVG
                value={payUrl}
                size={210}
                level="M"
                includeMargin={false}
                className="w-48 h-48 sm:w-52 sm:h-52"
              />
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-brand-subtext">
                <QrCode className="w-3.5 h-3.5" />
                <span>Foto de QR configurable desde app Android</span>
              </div>
            </div>
          )}
        </div>

        {/* Código de Operación */}
        <div className="mb-5">
          <span className="block text-[10px] font-extrabold tracking-wider text-brand-subtext uppercase mb-1.5">
            Código de operación
          </span>
          <span className="inline-block font-mono text-sm sm:text-base font-black text-brand-obsidian px-4 py-1.5 rounded-full bg-brand-muted border border-brand-border shadow-2xs">
            {precharge.public_id}
          </span>
        </div>

        {/* Estado */}
        <div className="mb-6 pt-4 border-t border-brand-border">
          <span className="block text-[10px] font-extrabold tracking-wider text-brand-subtext uppercase mb-2.5">
            Estado de la transacción
          </span>
          <div className="flex items-center justify-center">
            <PaymentStatusBadge status={status} size="lg" />
          </div>

          {/* Indicador de conexión Realtime */}
          <div className="mt-3.5 inline-flex items-center gap-2 text-xs font-bold text-brand-obsidian/70 bg-brand-muted px-3.5 py-1 rounded-full border border-brand-border/60 shadow-2xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-brand-mint-dark animate-pulse' : 'bg-slate-300'}`}></span>
            <span>
              {isMockMode
                ? 'Modo simulación'
                : isConnected
                ? 'Sincronizado en tiempo real'
                : 'Conectando a Realtime...'}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <button
            onClick={handleCopyCode}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand-border text-brand-obsidian font-bold text-xs bg-brand-muted hover:bg-white transition shadow-2xs"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-brand-mint-dark" />
                <span className="text-brand-mint-dark font-bold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-brand-subtext" />
                <span>Copiar código</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand-border text-brand-obsidian font-bold text-xs bg-brand-muted hover:bg-white transition shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-brand-mint-dark" />
                <span className="text-brand-mint-dark font-bold">Enlace copiado</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 text-brand-subtext" />
                <span>Copiar enlace</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={onNewPrecharge}
            type="button"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-brand-obsidian text-white font-bold text-xs hover:bg-black transition shadow-sm active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4 text-brand-mint" />
            <span>Nuevo cobro</span>
          </button>
        </div>
      </div>

      {/* Guía de validación y monto exacto inspirada en la referencia */}
      {!isMatched && (
        <PaymentGuide
          expectedAmount={precharge.expected_amount}
          merchantTag={merchantConfig?.merchant_tag}
        />
      )}

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
