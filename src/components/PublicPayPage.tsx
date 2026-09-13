import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Precharge } from '../types/payment';
import { getPrechargeByPublicId, getMerchantConfig, MerchantConfig } from '../services/api';
import { usePrechargeRealtime } from '../hooks/usePrechargeRealtime';
import { PaymentStatusBadge } from './PaymentStatus';
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, Download, Check, Sparkles, Lock, Tag } from 'lucide-react';
import { PaymentGuide } from './PaymentGuide';
import { PaymentSuccessScreen } from './PaymentSuccessScreen';

interface PublicPayPageProps {
  publicId: string;
}

export const PublicPayPage: React.FC<PublicPayPageProps> = ({ publicId }) => {
  const [initialData, setInitialData] = useState<Precharge | null>(null);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingQr, setIsDownloadingQr] = useState(false);
  const [downloadedQr, setDownloadedQr] = useState(false);

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

  const handleDownloadQrCard = async () => {
    if (!precharge) return;
    try {
      setIsDownloadingQr(true);

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 960;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context no disponible');

      // Helper para rectángulos redondeados
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

      // Barra superior verde menta Stayhigh
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

  if (isMatched) {
    return (
      <div className="space-y-4">
        <PaymentSuccessScreen
          precharge={precharge}
          merchantConfig={merchantConfig}
          onReset={() => {
            window.location.href = '/';
          }}
          isMerchantView={false}
        />

        {/* DEV MODE Controls for testing */}
        {isMockMode && (
          <div className="max-w-md mx-auto p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <span className="text-xs font-bold text-amber-900 block mb-1">DEV MODE: Cambiar Estado</span>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => simulateStatus('WAITING')}
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
    <div className="max-w-md mx-auto my-8 px-4">
      <div className="bg-white border border-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] rounded-squircle-lg p-6 sm:p-7 text-center transition-all">
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

          {/* Concepto / Pedido si existe */}
          {((precharge.metadata?.concept as string) || precharge.concept || merchantConfig?.product_details) && (
            <div className="mt-3.5 pt-3 border-t border-brand-obsidian/15 flex items-start gap-2.5 text-left">
              <Tag className="w-4 h-4 text-brand-obsidian/80 mt-0.5 shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-obsidian/70 block">
                  Concepto / Pedido
                </span>
                <span className="text-sm font-black text-brand-obsidian leading-snug block">
                  {(precharge.metadata?.concept as string) || precharge.concept || merchantConfig?.product_details}
                </span>
              </div>
            </div>
          )}

          {/* Aviso del comercio si existe */}
          {(precharge.seller_message || precharge.metadata?.seller_message || merchantConfig?.seller_message) && (
            <div className="mt-3 p-3 bg-brand-obsidian/10 rounded-xl text-left">
              <span className="text-[10px] font-bold text-brand-obsidian/80 uppercase tracking-wider block">
                Aviso del comercio
              </span>
              <p className="text-xs text-brand-obsidian font-medium whitespace-pre-line mt-0.5">
                {precharge.seller_message || precharge.metadata?.seller_message || merchantConfig?.seller_message}
              </p>
            </div>
          )}

          {/* Nota del comprador si existe */}
          {precharge.description && (
            <p className="text-xs font-medium text-brand-obsidian/70 mt-2 italic">
              Nota del cliente: "{precharge.description}"
            </p>
          )}
        </div>

        {/* Cuerpo */}
        <div className="space-y-5">
          {/* Referencia */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-subtext mb-1">
              Referencia de cobro
            </span>
            <span className="inline-block font-mono text-sm font-black text-brand-obsidian px-3 py-1 rounded-xl bg-brand-muted border border-brand-border">
              {precharge.public_id}
            </span>
          </div>

          {!isMatched && (
            <>
              {/* Imagen del QR: Foto Estática o Fallback dinámico */}
              <div className="flex flex-col items-center justify-center">
                {merchantConfig?.qr_image_url ? (
                  <div className="p-3 bg-brand-muted border border-brand-border rounded-2xl shadow-xs inline-block">
                    <img
                      src={merchantConfig.qr_image_url}
                      alt="QR de Pago Yape / Plin"
                      crossOrigin="anonymous"
                      className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="inline-flex p-3.5 bg-brand-muted border border-brand-border rounded-2xl shadow-xs">
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

              {/* Nombre del dueño del QR debajo de la imagen */}
              {merchantConfig?.merchant_tag && (
                <div className="-mt-1 mb-2 text-center">
                  <span className="text-xl sm:text-2xl font-black text-brand-obsidian tracking-tight block">
                    {merchantConfig.merchant_tag}
                  </span>
                </div>
              )}

              {/* Botón Descargar QR con instrucciones de monto exacto */}
              <div className="w-full max-w-sm mx-auto my-3">
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

              {/* Estado actual */}
              <div>
                <PaymentStatusBadge status={status} size="lg" />
              </div>
            </>
          )}

          {/* Indicador de actualización en tiempo real */}
          <div className="pt-3 border-t border-brand-border text-xs text-brand-subtext">
            {isMockMode ? (
              <span>Modo simulación activo</span>
            ) : isConnected ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-brand-mint-dark animate-pulse"></span>
                Sincronización en vivo activa
              </span>
            ) : (
              <span>Conectando con el servicio de pagos...</span>
            )}
          </div>
        </div>
      </div>

      {/* Guía de validación y monto exacto inspirada en la referencia */}
      {!isMatched && (
        <div className="mt-5">
          <PaymentGuide
            expectedAmount={precharge.expected_amount}
            merchantTag={merchantConfig?.merchant_tag}
          />
        </div>
      )}

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
