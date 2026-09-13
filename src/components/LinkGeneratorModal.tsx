import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePaymentLink } from '../services/security';
import { MerchantConfig, updateMerchantMessages, createPaymentLink } from '../services/api';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  QrCode,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  MessageSquareQuote,
  CheckCircle2,
  Database,
  Clock,
  Tag,
} from 'lucide-react';

interface LinkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantConfig?: MerchantConfig | null;
}

export const LinkGeneratorModal: React.FC<LinkGeneratorModalProps> = ({
  isOpen,
  onClose,
  merchantConfig,
}) => {
  const [mode, setMode] = useState<'fixed' | 'free'>('fixed');
  const [amount, setAmount] = useState<string>('25.00');
  const [concept, setConcept] = useState<string>('');
  const [sellerMessage, setSellerMessage] = useState<string>(merchantConfig?.seller_message || '');
  const [confirmationMessage, setConfirmationMessage] = useState<string>(merchantConfig?.confirmation_message || '');
  const [linkExpiryMinutes, setLinkExpiryMinutes] = useState<number>(60);
  const [qrExpiryMinutes, setQrExpiryMinutes] = useState<number>(15);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingToSupabase, setIsSavingToSupabase] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showQr, setShowQr] = useState<boolean>(false);

  useEffect(() => {
    if (merchantConfig) {
      if (merchantConfig.seller_message && !sellerMessage) {
        setSellerMessage(merchantConfig.seller_message);
      }
      if (merchantConfig.confirmation_message && !confirmationMessage) {
        setConfirmationMessage(merchantConfig.confirmation_message);
      }
    }
  }, [merchantConfig]);

  if (!isOpen) return null;

  const deviceId = merchantConfig?.device_id || merchantConfig?.id || 'main';
  const publicBaseUrl = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setSaveStatus(null);

    try {
      // 1. Guardar mensajes en la nube (Supabase) si se desea
      if (merchantConfig?.id && (sellerMessage.trim() || confirmationMessage.trim())) {
        setIsSavingToSupabase(true);
        const res = await updateMerchantMessages(
          merchantConfig.id,
          sellerMessage,
          confirmationMessage
        );
        if (res.success) {
          if (merchantConfig) {
            merchantConfig.seller_message = sellerMessage.trim() || null;
            merchantConfig.confirmation_message = confirmationMessage.trim() || null;
          }
          setSaveStatus({
            type: 'success',
            message: '✓ Mensajes guardados en la nube (Supabase).',
          });
        }
        setIsSavingToSupabase(false);
      }

      // 2. Generar el enlace en la base de datos de payment_links (/l/:code)
      const parsedAmount = mode === 'fixed' ? parseFloat(amount) : undefined;
      const safeQrMinutes = linkExpiryMinutes > 0
        ? Math.min(Math.max(10, qrExpiryMinutes), linkExpiryMinutes)
        : Math.max(10, qrExpiryMinutes);

      const dbLink = await createPaymentLink({
        deviceId: deviceId !== 'main' ? deviceId : null,
        amount: parsedAmount && parsedAmount > 0 ? parsedAmount : null,
        concept: concept.trim() || null,
        sellerMessage: sellerMessage.trim() || null,
        confirmationMessage: confirmationMessage.trim() || null,
        expiresInMinutes: linkExpiryMinutes > 0 ? linkExpiryMinutes : null,
        qrTimeoutMinutes: safeQrMinutes,
      });

      let url: string;
      if (dbLink && dbLink.code) {
        url = `${publicBaseUrl}/l/${dbLink.code}`;
      } else {
        // Fallback a enlace firmado si la tabla payment_links estuviera ocupada
        url = await generatePaymentLink(publicBaseUrl, {
          deviceId,
          amount: parsedAmount && parsedAmount > 0 ? parsedAmount : undefined,
          includeMessagesInUrl: false,
        });
      }

      setGeneratedUrl(url);
    } catch (err) {
      console.error('Error al generar enlace:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToSupabase = async () => {
    if (!merchantConfig?.id) return;
    setIsSavingToSupabase(true);
    setSaveStatus(null);
    const res = await updateMerchantMessages(
      merchantConfig.id,
      sellerMessage,
      confirmationMessage
    );
    if (res.success) {
      setSaveStatus({
        type: 'success',
        message: '¡Mensajes guardados con éxito en Supabase para tu tienda!',
      });
      if (merchantConfig) {
        merchantConfig.seller_message = sellerMessage.trim() || null;
        merchantConfig.confirmation_message = confirmationMessage.trim() || null;
      }
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'No se pudo guardar en Supabase.',
      });
    }
    setIsSavingToSupabase(false);
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    if (!generatedUrl) return;
    const msg = encodeURIComponent(
      `Hola! Aquí tienes tu enlace de cobro seguro de ${merchantConfig?.merchant_name || 'Stayhigh'}:
${generatedUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-obsidian/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-squircle-lg sm:rounded-[36px] w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/80 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 bg-brand-obsidian text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-brand-mint">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Generador de Enlaces de Cobro
              </h3>
              <p className="text-xs text-slate-300">
                {merchantConfig?.merchant_name || 'Comercio Stayhigh'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Selector Monto Fijo vs Monto Libre */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext mb-2">
                Tipo de Enlace
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-brand-muted rounded-2xl border border-brand-border">
                <button
                  type="button"
                  onClick={() => setMode('fixed')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                    mode === 'fixed'
                      ? 'bg-brand-obsidian text-white shadow-xs'
                      : 'text-brand-subtext hover:text-brand-obsidian'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Monto Fijo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('free')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                    mode === 'free'
                      ? 'bg-brand-obsidian text-white shadow-xs'
                      : 'text-brand-subtext hover:text-brand-obsidian'
                  }`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Monto Libre</span>
                </button>
              </div>
            </div>

            {/* Input de Monto si es fijo */}
            {mode === 'fixed' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext mb-1.5">
                  Monto a Cobrar (S/)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-obsidian font-black text-lg">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-brand-border font-black text-xl text-brand-obsidian bg-brand-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-obsidian/10 transition"
                  />
                </div>
                <span className="text-[11px] text-brand-subtext mt-1 block">
                  El monto viaja firmado digitalmente y el cliente no lo puede alterar.
                </span>
              </div>
            )}

            {/* Concepto / Detalle del Pedido */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-obsidian" />
                  Concepto / Detalle del Pedido
                </label>
                <span className="text-[10px] font-semibold text-brand-subtext">Opcional</span>
              </div>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej. 1 Hamburguesa Royal + Papas (Delivery)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm font-medium text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-obsidian/10 transition"
              />
            </div>

            {/* Temporizador Maestro del Enlace (corre en formulario y QR) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Validez del Enlace (Temporizador Maestro)
                </label>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: '15 min', val: 15 },
                  { label: '30 min', val: 30 },
                  { label: '1 hora', val: 60 },
                  { label: '24 horas', val: 1440 },
                  { label: 'Sin límite', val: 0 },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      setLinkExpiryMinutes(opt.val);
                      if (opt.val > 0 && qrExpiryMinutes > opt.val) {
                        setQrExpiryMinutes(opt.val);
                      }
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                      linkExpiryMinutes === opt.val
                        ? 'bg-brand-obsidian text-white shadow-2xs'
                        : 'bg-brand-muted text-brand-subtext hover:text-brand-obsidian border border-brand-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-brand-subtext mt-1.5">
                Corre en el formulario y en el QR desde que se crea el enlace, incluso si aún no lo abren.
              </p>
            </div>

            {/* Temporizador de Pantalla QR (mínimo 10 min, no puede superar al maestro) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Tiempo en Pantalla QR (Mínimo 10 min)
                </label>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '10 min', val: 10 },
                  { label: '15 min', val: 15 },
                  { label: '20 min', val: 20 },
                  { label: '30 min', val: 30 },
                ].map((opt) => {
                  const isExceeded = linkExpiryMinutes > 0 && opt.val > linkExpiryMinutes;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      disabled={isExceeded}
                      onClick={() => !isExceeded && setQrExpiryMinutes(opt.val)}
                      title={isExceeded ? `No puede superar el tiempo maestro (${linkExpiryMinutes} min)` : undefined}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition ${
                        isExceeded
                          ? 'opacity-40 cursor-not-allowed bg-brand-muted/50 text-brand-subtext/60 border border-dashed border-brand-border line-through'
                          : qrExpiryMinutes === opt.val
                            ? 'bg-brand-obsidian text-white shadow-2xs cursor-pointer'
                            : 'bg-brand-muted text-brand-subtext hover:text-brand-obsidian border border-brand-border cursor-pointer'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-brand-subtext mt-1.5">
                Tiempo para completar la transferencia en Yape. {linkExpiryMinutes > 0 ? `(Limitado a máximo ${linkExpiryMinutes} min por el enlace maestro)` : ''}
              </p>
            </div>

            {/* Mensaje del Vendedor al Abrir el Link */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext flex items-center gap-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" />
                  Mensaje del Vendedor (Al abrir el link)
                </label>
                <span className="text-[10px] font-semibold text-brand-subtext">Opcional</span>
              </div>
              <textarea
                value={sellerMessage}
                onChange={(e) => setSellerMessage(e.target.value)}
                rows={2}
                placeholder="Ej. Pedido #102 - 1 Hamburguesa Royal + Papas. Envío incluido."
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm font-medium text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-obsidian/10 transition"
              />
              <p className="text-[11px] text-brand-subtext mt-1">
                Aparecerá en una tarjeta del vendedor al abrir el checkout. La casilla del cliente quedará libre para su propia nota.
              </p>
            </div>

            {/* Mensaje del Vendedor al Confirmar Compra */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-subtext flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Mensaje del Vendedor (Al confirmar compra)
                </label>
                <span className="text-[10px] font-semibold text-brand-subtext">Opcional</span>
              </div>
              <textarea
                value={confirmationMessage}
                onChange={(e) => setConfirmationMessage(e.target.value)}
                rows={2}
                placeholder="Ej. ¡Gracias por tu compra! Tu orden estará lista en 25 minutos. Te escribiremos al WhatsApp."
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs sm:text-sm font-medium text-brand-obsidian placeholder-slate-400 bg-brand-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-obsidian/10 transition"
              />
              <p className="text-[11px] text-brand-subtext mt-1">
                Aparecerá destacado en la pantalla grande de confirmación cuando el pago sea validado.
              </p>
            </div>

            {/* Opción de guardar mensajes predeterminados en Supabase */}
            <div className="p-3.5 bg-brand-muted/80 border border-brand-border rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-[11px] text-brand-subtext font-medium">
                  ¿Guardar como mensajes fijos de tu tienda en Supabase?
                </span>
                <button
                  type="button"
                  onClick={handleSaveToSupabase}
                  disabled={isSavingToSupabase || !merchantConfig?.id}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-brand-border text-brand-obsidian text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5 text-brand-mint-dark" />
                  <span>{isSavingToSupabase ? 'Guardando...' : 'Guardar en Supabase'}</span>
                </button>
              </div>
              {saveStatus && (
                <p
                  className={`text-xs font-semibold mt-2 ${
                    saveStatus.type === 'success' ? 'text-emerald-700' : 'text-brand-red'
                  }`}
                >
                  {saveStatus.message}
                </p>
              )}
            </div>

            {/* Botón Generar */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-obsidian text-white font-bold text-xs uppercase tracking-wider hover:bg-black transition shadow-sm active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-brand-mint" />
              <span>{generatedUrl ? 'Actualizar Enlace' : 'Generar Enlace Seguro'}</span>
            </button>
          </form>

          {/* Resultado: Enlace Generado */}
          {generatedUrl && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Enlace Listo
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    Ultra-Corto (Nube)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? 'Ocultar QR' : 'Ver QR'}</span>
                </button>
              </div>

              <p className="text-[11px] text-emerald-800 font-medium">
                Los mensajes personalizados están guardados en Supabase, por lo que el link no contiene textos largos y es ideal para WhatsApp o redes.
              </p>

              {/* URL Box */}
              <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-700 truncate select-all">
                  {generatedUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-obsidian text-white text-xs font-bold hover:bg-black transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-mint" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Vista previa del QR */}
              {showQr && (
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-emerald-200">
                  <QRCodeSVG value={generatedUrl} size={160} level="M" />
                  <span className="text-[11px] text-slate-500 font-medium mt-2">
                    Escanea para abrir el enlace generado
                  </span>
                </div>
              )}

              {/* Botones de Compartir */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-emerald-200 text-slate-800 text-xs font-bold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Probar Enlace</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
