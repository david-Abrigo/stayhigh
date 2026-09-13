import React, { useState } from 'react';
import { Precharge } from '../types/payment';
import { MerchantConfig } from '../services/api';
import {
  CheckCircle2,
  Printer,
  Share2,
  Copy,
  Check,
  Store,
  Clock,
  ShieldCheck,
  FileText,
  PlusCircle,
  ArrowLeft,
  Sparkles,
  MessageSquareQuote,
  BadgeCheck,
} from 'lucide-react';

interface PaymentSuccessScreenProps {
  precharge: Precharge;
  merchantConfig?: MerchantConfig | null;
  onReset?: () => void;
  isMerchantView?: boolean;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  precharge,
  merchantConfig,
  onReset,
  isMerchantView = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mensaje de confirmación del vendedor (especificado en el link / orden o en la configuración de la tienda)
  const confirmationMessage =
    precharge.confirmation_message ||
    precharge.metadata?.confirmation_message ||
    merchantConfig?.confirmation_message ||
    '¡Muchas gracias por tu compra! Tu pago ha sido verificado y registrado exitosamente. Tu orden se encuentra en proceso.';

  // Mensaje o pedido inicial del vendedor (si hubo uno)
  const sellerInitialMessage =
    precharge.seller_message ||
    precharge.metadata?.seller_message ||
    merchantConfig?.seller_message ||
    merchantConfig?.welcome_message;

  // Detalle del producto / concepto configurado en la tienda
  const productDetails = merchantConfig?.product_details;

  // Nota del comprador (si ingresó alguna)
  const buyerNote = precharge.description || precharge.metadata?.buyer_note;

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
      const publicBaseUrl = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
      const payUrl = `${publicBaseUrl}/pay/${precharge.public_id}`;
      await navigator.clipboard.writeText(payUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const publicBaseUrl = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
    const payUrl = `${publicBaseUrl}/pay/${precharge.public_id}`;
    const shareText = `Comprobante de Pago Confirmado - S/ ${precharge.expected_amount.toFixed(2)} a ${merchantConfig?.merchant_name || 'Stayhigh'}. Ref: ${precharge.public_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprobante de Pago Confirmado',
          text: shareText,
          url: payUrl,
        });
      } catch {
        // cancelled or error
      }
    } else {
      handleCopyLink();
    }
  };

  const formattedDate = precharge.matched_at
    ? new Date(precharge.matched_at).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : new Date().toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

  return (
    <div className="w-full max-w-2xl mx-auto my-4 sm:my-8 px-2 sm:px-4 transition-all">
      {/* Contenedor principal estilo Voucher Digital */}
      <div className="bg-white rounded-squircle-lg sm:rounded-[36px] p-6 sm:p-10 shadow-[0_15px_45px_rgba(0,0,0,0.06)] border border-white/80 overflow-hidden relative">
        {/* Adorno superior sutil */}
        <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-brand-mint via-brand-mint-dark to-brand-lavender"></div>

        {/* Encabezado de Celebración y Confirmación */}
        <div className="text-center pt-2 pb-6">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brand-mint/30 flex items-center justify-center animate-pulse"></div>
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-mint flex items-center justify-center shadow-lg shadow-brand-mint/40">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-brand-obsidian" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-mint/40 border border-brand-mint text-brand-obsidian text-xs font-black tracking-wide uppercase mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-mint-dark" />
            <span>Operación Exitosa</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-brand-obsidian tracking-tight mt-1">
            ¡PAGO CONFIRMADO!
          </h1>
          <p className="text-xs sm:text-sm font-medium text-brand-subtext mt-1 max-w-md mx-auto">
            La transferencia por Yape / Plin ha sido validada y conciliada automáticamente en tiempo real.
          </p>
        </div>

        {/* Tarjeta Gigante de Monto y Pagador */}
        <div className="mb-6 p-6 sm:p-8 rounded-3xl bg-brand-obsidian text-white text-center shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-brand-mint/10 pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-brand-lavender/10 pointer-events-none"></div>

          <span className="text-xs sm:text-sm font-bold tracking-wider text-slate-300 uppercase block mb-1">
            Monto Total Pagado
          </span>
          <div className="text-4xl sm:text-6xl font-black tracking-tight text-brand-mint my-1">
            S/ {precharge.expected_amount.toFixed(2)}
          </div>
          <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs sm:text-sm font-bold">
            <BadgeCheck className="w-4 h-4 text-brand-mint" />
            <span>Pagador: {precharge.expected_name}</span>
          </div>
        </div>

        {/* SECCIÓN ESPECIAL: MENSAJE DEL VENDEDOR AL CONFIRMAR COMPRA */}
        <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-left shadow-xs">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <MessageSquareQuote className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 block leading-tight">
                Mensaje del Vendedor
              </span>
              <span className="text-[10px] font-semibold text-emerald-700">
                Información para la entrega o seguimiento
              </span>
            </div>
            <span className="ml-auto hidden sm:inline-block text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Post-Venta
            </span>
          </div>
          <div className="bg-white/90 rounded-2xl p-4 border border-emerald-200/70 mt-2">
            <p className="text-sm sm:text-base font-semibold text-emerald-950 leading-relaxed whitespace-pre-line">
              {confirmationMessage}
            </p>
          </div>
        </div>

        {/* DESGLOSE DEL COMPROBANTE DIGITAL */}
        <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-brand-muted border border-brand-border text-xs sm:text-sm space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border/80">
            <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Código de Operación
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-brand-obsidian bg-white px-2.5 py-1 rounded-lg border border-brand-border text-xs sm:text-sm">
                {precharge.public_id}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copiar código"
                className="p-1 rounded-md text-brand-subtext hover:text-brand-obsidian hover:bg-white transition"
              >
                {copiedCode ? <Check className="w-4 h-4 text-brand-mint-dark" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-brand-border/80">
            <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Fecha y Hora
            </span>
            <span className="font-semibold text-brand-obsidian">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-brand-border/80">
            <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Comercio
            </span>
            <span className="font-bold text-brand-obsidian text-right">
              {merchantConfig?.merchant_name || 'Stayhigh Checkout'}
            </span>
          </div>

          {merchantConfig?.merchant_tag && (
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/80">
              <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px]">
                Titular Receptor
              </span>
              <span className="font-black text-xs sm:text-sm text-brand-obsidian bg-brand-lavender/40 px-2.5 py-0.5 rounded-full">
                {merchantConfig.merchant_tag}
              </span>
            </div>
          )}

          {/* Detalle del producto / concepto si existe */}
          {productDetails && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-3 border-b border-brand-border/80">
              <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px]">
                Concepto / Pedido
              </span>
              <span className="font-semibold text-brand-obsidian text-left sm:text-right">
                {productDetails}
              </span>
            </div>
          )}

          {/* Si hubo mensaje previo del vendedor o pedido */}
          {sellerInitialMessage && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-3 border-b border-brand-border/80">
              <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px]">
                Referencia del Pedido
              </span>
              <span className="font-medium text-brand-obsidian text-left sm:text-right">
                {sellerInitialMessage}
              </span>
            </div>
          )}

          {/* Si el comprador dejó una nota personal */}
          {buyerNote && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-3 border-b border-brand-border/80">
              <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px]">
                Nota del Comprador
              </span>
              <span className="font-medium text-brand-obsidian text-left sm:text-right italic">
                "{buyerNote}"
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-brand-subtext uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-mint-dark" />
              Estado de Verificación
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Conciliado en tiempo real
            </span>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="space-y-3 pt-2 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-muted hover:bg-white border border-brand-border text-brand-obsidian font-bold text-xs uppercase tracking-wider transition shadow-2xs active:scale-[0.99]"
            >
              <Printer className="w-4 h-4 text-brand-subtext" />
              <span>Imprimir Comprobante</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-muted hover:bg-white border border-brand-border text-brand-obsidian font-bold text-xs uppercase tracking-wider transition shadow-2xs active:scale-[0.99]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-brand-mint-dark" />
                  <span className="text-brand-mint-dark font-bold">¡Enlace Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-brand-subtext" />
                  <span>Compartir Recibo</span>
                </>
              )}
            </button>
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand-obsidian text-white font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-black transition shadow-sm active:scale-[0.99] mt-2"
            >
              {isMerchantView ? (
                <>
                  <PlusCircle className="w-4 h-4 text-brand-mint" />
                  <span>Realizar Nuevo Cobro</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 text-brand-mint" />
                  <span>Volver al Inicio</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
