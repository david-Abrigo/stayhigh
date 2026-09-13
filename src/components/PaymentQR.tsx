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

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Tarjeta Principal */}
      <div className="bg-white rounded-squircle-lg p-6 sm:p-9 shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 text-center transition-all">
        {/* Banner de Pago Confirmado o Cobro en Espera */}
        {isMatched ? (
          <div className="mb-6 p-6 rounded-2xl bg-brand-mint text-brand-obsidian text-center shadow-xs animate-fade-in">
            <div className="w-14 h-14 bg-brand-obsidian text-brand-mint rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black tracking-wide text-brand-obsidian">
              PAGO CONFIRMADO
            </h3>
            <p className="text-3xl sm:text-4xl font-black text-brand-obsidian mt-1.5 tracking-tight">
              S/ {precharge.expected_amount.toFixed(2)}
            </p>
            <p className="text-sm font-bold text-brand-obsidian/80 mt-1">
              {precharge.expected_name}
            </p>
            {precharge.matched_at && (
              <p className="text-[11px] font-semibold text-brand-obsidian/60 mt-2 bg-brand-obsidian/5 inline-block px-3 py-1 rounded-full">
                Confirmado: {new Date(precharge.matched_at).toLocaleTimeString('es-PE')}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-5 p-5 rounded-2xl bg-brand-obsidian text-white text-center shadow-xs">
            <span className="inline-block text-[10px] font-bold tracking-widest text-brand-mint uppercase bg-white/10 px-2.5 py-0.5 rounded-full mb-1">
              Cobro en espera
            </span>
            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                S/ {precharge.expected_amount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200 mt-1">{precharge.expected_name}</p>
            {precharge.description && (
              <p className="text-xs text-slate-400 mt-0.5">{precharge.description}</p>
            )}
          </div>
        )}

        {/* Etiqueta del Titular (Verificación en Yape/Plin) */}
        {merchantConfig?.merchant_tag && (
          <div className="my-4 p-3.5 bg-brand-lavender/30 border border-brand-lavender/50 rounded-2xl text-center">
            <span className="text-[10px] font-bold tracking-wider text-brand-lavender-dark uppercase block">
              Titular en Yape / Plin
            </span>
            <span className="text-base sm:text-lg font-black text-brand-obsidian tracking-wide block mt-0.5">
              {merchantConfig.merchant_tag}
            </span>
            <span className="text-[11px] font-medium text-brand-subtext block mt-0.5">
              Verifica que este nombre coincida antes de transferir
            </span>
          </div>
        )}

        {/* Imagen del QR: Foto Estática o Fallback dinámico */}
        <div className="my-5 flex flex-col items-center justify-center">
          {merchantConfig?.qr_image_url ? (
            <div className="p-3 bg-brand-muted border border-brand-border rounded-2xl shadow-xs inline-block">
              <img
                src={merchantConfig.qr_image_url}
                alt="QR de Pago Yape / Plin"
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="p-4 bg-brand-muted border border-brand-border rounded-2xl shadow-xs inline-block">
              <QRCodeSVG
                value={payUrl}
                size={210}
                level="M"
                includeMargin={false}
                className="w-48 h-48 sm:w-52 sm:h-52"
              />
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-brand-subtext">
                <QrCode className="w-3 h-3" />
                <span>Foto de QR configurable desde app Android</span>
              </div>
            </div>
          )}
        </div>

        {/* Código de Operación */}
        <div className="mb-5">
          <span className="block text-[11px] font-bold tracking-wider text-brand-subtext uppercase mb-1">
            Código de operación
          </span>
          <span className="inline-block font-mono text-base font-black text-brand-obsidian px-3.5 py-1 rounded-xl bg-brand-muted border border-brand-border">
            {precharge.public_id}
          </span>
        </div>

        {/* Estado */}
        <div className="mb-6 pt-4 border-t border-brand-border">
          <span className="block text-[11px] font-bold tracking-wider text-brand-subtext uppercase mb-2">
            Estado de la transacción
          </span>
          <div className="flex items-center justify-center">
            <PaymentStatusBadge status={status} size="lg" />
          </div>

          {/* Indicador de conexión Realtime */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-brand-subtext">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-brand-mint-dark' : 'text-slate-300'}`} />
            <span>
              {isMockMode
                ? 'Modo simulación activo'
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
