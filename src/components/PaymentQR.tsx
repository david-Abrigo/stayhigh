import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Precharge, PrechargeStatus } from '../types/payment';
import { PaymentStatusBadge } from './PaymentStatus';
import { getMerchantConfig, MerchantConfig } from '../services/api';
import { Copy, Check, PlusCircle, ExternalLink, Radio, CheckCircle2, QrCode, Download, Loader2, Sparkles, Lock, Tag, Clock, AlertTriangle } from 'lucide-react';
import { PaymentGuide } from './PaymentGuide';
import { PaymentSuccessScreen } from './PaymentSuccessScreen';

interface PaymentQRProps {
  precharge: Precharge;
  status: PrechargeStatus;
  isConnected: boolean;
  isMockMode: boolean;
  onNewPrecharge: () => void;
  onSimulateStatus: (status: PrechargeStatus) => void;
  linkExpiresAt?: string | null;
}

export const PaymentQR: React.FC<PaymentQRProps> = ({
  precharge,
  status,
  isConnected,
  isMockMode,
  onNewPrecharge,
  onSimulateStatus,
  linkExpiresAt,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [downloadedQr, setDownloadedQr] = useState(false);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);

  // Temporizador Unificado: Solo UN tiempo visible en pantalla
  const [effectiveSecondsLeft, setEffectiveSecondsLeft] = useState<number | null>(null);
  const [isMasterExpired, setIsMasterExpired] = useState(false);
  const [isQrExpired, setIsQrExpired] = useState(false);

  useEffect(() => {
    if (status === 'MATCHED') {
      setEffectiveSecondsLeft(null);
      setIsMasterExpired(false);
      setIsQrExpired(false);
      return;
    }

    const calcTimes = () => {
      const now = Date.now();

      // Tiempo restante del enlace maestro
      let masterRemaining: number | null = null;
      if (linkExpiresAt) {
        const masterMs = new Date(linkExpiresAt).getTime() - now;
        masterRemaining = Math.floor(masterMs / 1000);
      }

      // Tiempo restante de la ventana QR
      let qrTargetMs: number;
      if (precharge.expires_at) {
        qrTargetMs = new Date(precharge.expires_at).getTime();
      } else {
        const createdMs = precharge.created_at ? new Date(precharge.created_at).getTime() : now;
        qrTargetMs = createdMs + 15 * 60 * 1000;
      }
      const qrRemaining = Math.floor((qrTargetMs - now) / 1000);

      // Verificación de expiración
      const masterDead = masterRemaining !== null && masterRemaining <= 0;
      const qrDead = qrRemaining <= 0;

      setIsMasterExpired(masterDead);
      setIsQrExpired(!masterDead && qrDead);

      if (masterDead || qrDead) {
        setEffectiveSecondsLeft(0);
        return;
      }

      // Tiempo unificado en pantalla: el tiempo de QR nunca supera al enlace maestro
      if (masterRemaining !== null) {
        setEffectiveSecondsLeft(Math.max(0, Math.min(masterRemaining, qrRemaining)));
      } else {
        setEffectiveSecondsLeft(Math.max(0, qrRemaining));
      }
    };

    calcTimes();
    const interval = setInterval(calcTimes, 1000);
    return () => clearInterval(interval);
  }, [linkExpiresAt, precharge.expires_at, precharge.created_at, status]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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

  const handleDownloadQrCard = async () => {
    try {
      setIsDownloadingQr(true);

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context no disponible');

      // Helper para rectángulos redondeados con compatibilidad total
      const drawRoundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        fillColor?: string,
        strokeColor?: string,
        lineWidth: number = 1
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      // 1. Fondo elegante oscuro con degradado
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 960);
      bgGrad.addColorStop(0, '#0B0F19');
      bgGrad.addColorStop(0.4, '#111827');
      bgGrad.addColorStop(1, '#1E293B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 640, 960);

      // Barra de acento verde menta Stayhigh superior
      ctx.fillStyle = '#10B981';
      ctx.fillRect(0, 0, 640, 6);

      // 2. Cabecera
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('STAYHIGH SMART CHECKOUT • PAGO CON YAPE', 320, 42);

      const storeName = merchantConfig?.merchant_name || 'Stayhigh Store';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(storeName, 320, 74);

      // Badge Titular Yape
      const titular = merchantConfig?.merchant_tag || 'David Abr*';
      const titularLabel = `TITULAR YAPE: ${titular}`;
      ctx.font = 'bold 12px sans-serif';
      const titularWidth = ctx.measureText(titularLabel).width + 24;
      drawRoundRect(320 - titularWidth / 2, 90, titularWidth, 26, 13, '#EDE9FE', '#C4B5FD', 1);
      ctx.fillStyle = '#5B21B6';
      ctx.fillText(titularLabel, 320, 107);

      // 3. Tarjeta Blanca para el Código QR
      drawRoundRect(160, 136, 320, 320, 24, '#FFFFFF', '#E2E8F0', 2);

      // Cargar imagen del QR
      let qrImg: HTMLImageElement | null = null;
      if (merchantConfig?.qr_image_url) {
        try {
          qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            const cacheBust = (merchantConfig.qr_image_url!.includes('?') ? '&' : '?') + 't=' + Date.now();
            img.src = merchantConfig.qr_image_url! + cacheBust;
          });
        } catch {
          qrImg = null;
        }
      }

      if (qrImg) {
        ctx.drawImage(qrImg, 175, 151, 290, 290);
      } else {
        const svgElement = document.querySelector('svg.w-48, svg.w-52, svg');
        if (svgElement) {
          try {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const URL = window.URL || window.webkitURL || window;
            const blobURL = URL.createObjectURL(svgBlob);
            const fallbackImg = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = blobURL;
            });
            ctx.drawImage(fallbackImg, 175, 151, 290, 290);
            URL.revokeObjectURL(blobURL);
          } catch {
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('Código QR de Pago', 320, 290);
          }
        }
      }

      // 4. SECCIÓN CRÍTICA: BANNER DESTACADO DE MONTO EXACTO
      const amountStr = precharge.expected_amount.toFixed(2);
      drawRoundRect(36, 480, 568, 160, 20, '#FEF3C7', '#F59E0B', 3);

      ctx.fillStyle = '#B45309';
      ctx.font = '900 14px sans-serif';
      ctx.fillText('⚠️  ¡ESCRIBE EL MONTO EXACTO EN TU YAPE!', 320, 516);

      ctx.fillStyle = '#0F172A';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(`S/ ${amountStr}`, 320, 574);

      ctx.fillStyle = '#92400E';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Digita exactamente esta cantidad para que tu pago se valide al instante.', 320, 612);

      // 5. Concepto o Detalle si existe
      const conceptText =
        (precharge.metadata?.concept as string) ||
        precharge.concept ||
        merchantConfig?.product_details;

      let nextY = 660;
      if (conceptText) {
        drawRoundRect(36, nextY, 568, 44, 12, '#1E293B', '#334155', 1);
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CONCEPTO:', 56, nextY + 27);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = 'bold 13px sans-serif';
        const displayConcept = conceptText.length > 50 ? conceptText.slice(0, 48) + '...' : conceptText;
        ctx.fillText(displayConcept, 150, nextY + 27);
        ctx.textAlign = 'center';
        nextY += 56;
      }

      // 6. Guía paso a paso para el comprador
      drawRoundRect(36, nextY, 568, 164, 18, '#1E293B', '#475569', 1.5);
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('PASOS PARA PAGAR CON ESTA IMAGEN:', 320, nextY + 34);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '500 13px sans-serif';
      ctx.fillText('1. Entra a tu app Yape y presiona "Escanear QR"', 60, nextY + 68);
      ctx.fillText('2. Toca el icono de "Galería" y sube esta imagen guardada', 60, nextY + 98);
      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 13.5px sans-serif';
      ctx.fillText(`3. Escribe el monto exacto: S/ ${amountStr} y confirma tu pago`, 60, nextY + 128);
      ctx.textAlign = 'center';

      // 7. Pie con Código de Operación
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`ID DE PAGO: ${precharge.public_id}`, 320, 936);

      // Descarga del archivo
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `pago-yape-${precharge.public_id}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadedQr(true);
      setTimeout(() => setDownloadedQr(false), 3500);
    } catch (err) {
      console.error('Error al generar la imagen de pago:', err);
      if (merchantConfig?.qr_image_url) {
        window.open(merchantConfig.qr_image_url, '_blank');
      }
    } finally {
      setIsDownloadingQr(false);
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
        {/* Tarjeta de Monto a Pagar (Estilo Mint con Monto Fijado y Concepto) */}
        <div className="mb-6 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-brand-mint text-brand-obsidian text-left shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-obsidian/75 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Monto a pagar
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-obsidian/10 px-2.5 py-0.5 rounded-full text-brand-obsidian">
              <Lock className="w-3 h-3" />
              Monto fijado
            </span>
          </div>

          <div className="text-4xl sm:text-5xl font-black text-brand-obsidian tracking-tight mt-1">
            S/ {precharge.expected_amount.toFixed(2)}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-semibold text-brand-obsidian/70">
            <span>Moneda: Soles (PEN)</span>
            {precharge.expected_name && (
              <span>Cliente: <strong className="text-brand-obsidian font-bold">{precharge.expected_name}</strong></span>
            )}
          </div>

          {/* Concepto y Aviso del comercio */}
          {(() => {
            const conceptText = (precharge.metadata?.concept as string) || precharge.concept || merchantConfig?.product_details;
            const rawSellerMsg = precharge.seller_message || precharge.metadata?.seller_message || merchantConfig?.seller_message || merchantConfig?.welcome_message;
            const showSellerMsg = rawSellerMsg && rawSellerMsg.trim().toLowerCase() !== conceptText?.trim().toLowerCase();

            return (
              <>
                {conceptText && (
                  <div className="mt-3.5 pt-3 border-t border-brand-obsidian/15 flex items-start gap-2.5 text-left">
                    <Tag className="w-4 h-4 text-brand-obsidian/80 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-obsidian/70 block">
                        Concepto / Pedido
                      </span>
                      <span className="text-sm font-black text-brand-obsidian leading-snug block">
                        {conceptText}
                      </span>
                    </div>
                  </div>
                )}

                {showSellerMsg && (
                  <div className="mt-3 p-3 bg-brand-obsidian/10 rounded-xl text-left">
                    <span className="text-[10px] font-bold text-brand-obsidian/80 uppercase tracking-wider block">
                      Aviso del comercio
                    </span>
                    <p className="text-xs text-brand-obsidian font-medium whitespace-pre-line mt-0.5">
                      {rawSellerMsg}
                    </p>
                  </div>
                )}
              </>
            );
          })()}

          {/* Nota opcional del cliente si existe */}
          {precharge.description && (
            <p className="text-xs font-medium text-brand-obsidian/70 mt-2 italic">
              Nota del cliente: "{precharge.description}"
            </p>
          )}
        </div>

        {/* Temporizador Unificado: Solo UN tiempo visible en pantalla */}
        {effectiveSecondsLeft !== null && status === 'WAITING' && (
          effectiveSecondsLeft === 0 ? (
            isMasterExpired ? (
              <div className="my-5 p-4 sm:p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-center animate-in fade-in">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1.5" />
                <h4 className="text-sm font-black uppercase tracking-wider text-red-950">
                  Esta oferta ha finalizado
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  El tiempo límite de esta oferta o precio especial ha terminado. No realices transferencias a este código.
                </p>
              </div>
            ) : (
              <div className="my-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-center animate-in fade-in">
                <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1.5" />
                <h4 className="text-sm font-black text-red-950">Código QR Expirado</h4>
                <p className="text-xs text-red-700 mt-1">
                  La ventana de tiempo para este código QR ha finalizado.
                </p>
                <button
                  type="button"
                  onClick={onNewPrecharge}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-obsidian text-white text-xs font-bold hover:bg-black transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-brand-mint" />
                  <span>Generar nuevo código QR</span>
                </button>
              </div>
            )
          ) : (
            <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center shrink-0 text-amber-800">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                    Esta oferta termina en:
                  </span>
                  <span className="text-xs font-bold text-amber-950">
                    Este precio solo disponible en este tiempo
                  </span>
                </div>
              </div>
              <div className="font-mono text-base font-black bg-white px-3.5 py-1.5 rounded-xl border border-amber-300 text-amber-950 shadow-2xs">
                {formatTime(effectiveSecondsLeft)}
              </div>
            </div>
          )
        )}

        {/* Imagen del QR: Foto Estática o Fallback dinámico */}
        <div className="my-5 flex flex-col items-center justify-center relative">
          {merchantConfig?.qr_image_url ? (
            <div className="p-3.5 bg-brand-muted border border-brand-border rounded-2xl sm:rounded-3xl shadow-xs inline-block relative">
              <img
                src={merchantConfig.qr_image_url}
                alt="QR de Pago Yape / Plin"
                crossOrigin="anonymous"
                className={`w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl transition ${
                  effectiveSecondsLeft === 0 ? 'opacity-20 blur-[2px]' : ''
                }`}
              />
              {effectiveSecondsLeft === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mb-1" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {isMasterExpired ? 'Enlace Vencido' : 'QR Vencido'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-brand-muted border border-brand-border rounded-2xl sm:rounded-3xl shadow-xs inline-block relative">
              <div className={effectiveSecondsLeft === 0 ? 'opacity-20 blur-[2px]' : ''}>
                <QRCodeSVG
                  value={payUrl}
                  size={210}
                  level="M"
                  includeMargin={false}
                  className="w-48 h-48 sm:w-52 sm:h-52"
                />
              </div>
              {effectiveSecondsLeft === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mb-1" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {isMasterExpired ? 'Enlace Vencido' : 'QR Vencido'}
                  </span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-brand-subtext">
                <QrCode className="w-3.5 h-3.5" />
                <span>Foto de QR configurable desde app Android</span>
              </div>
            </div>
          )}
        </div>

        {/* Nombre del dueño del QR debajo de la imagen */}
        {merchantConfig?.merchant_tag && (
          <div className="-mt-1 mb-3 text-center">
            <span className="text-xl sm:text-2xl font-black text-brand-obsidian tracking-tight block">
              {merchantConfig.merchant_tag}
            </span>
          </div>
        )}

        {/* Botón Descargar QR con instrucciones de monto exacto */}
        <div className="w-full max-w-sm mx-auto my-4">
          <button
            onClick={handleDownloadQrCard}
            disabled={isDownloadingQr}
            type="button"
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-[#742284] hover:bg-[#5f1b6d] text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-75 cursor-pointer"
          >
            {isDownloadingQr ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando imagen de pago...</span>
              </>
            ) : downloadedQr ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Imagen de Pago Descargada!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-emerald-300" />
                <span>Descargar QR para pagar en Yape</span>
              </>
            )}
          </button>
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
            <p className="text-[11.5px] leading-snug text-amber-950 font-medium">
              💡 <strong>¿Cómo pagar con la foto?</strong> Entra a tu app Yape, pulsa <strong>Escanear QR ➔ Galería</strong> y sube esta imagen. Recuerda escribir exactamente <span className="font-black text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded">S/ {precharge.expected_amount.toFixed(2)}</span>.
            </p>
          </div>
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
