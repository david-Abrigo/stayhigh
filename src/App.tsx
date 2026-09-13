import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { PricingPage } from './components/PricingPage';
import { ApiDocsPage } from './components/ApiDocsPage';
import { Footer } from './components/Footer';
import { PaymentForm } from './components/PaymentForm';
import { PaymentQR } from './components/PaymentQR';
import { PublicPayPage } from './components/PublicPayPage';
import { CreatePrechargeDTO, Precharge } from './types/payment';
import {
  createPrecharge,
  getMerchantConfig,
  getPaymentLinkByCode,
  getPrechargeByPublicId,
  MerchantConfig
} from './services/api';
import { usePrechargeRealtime } from './hooks/usePrechargeRealtime';
import { parseAndVerifyToken, cleanAddressBar } from './services/security';
import {
  savePrechargeSession,
  getActivePrechargeSession,
  clearPrechargeSession
} from './services/session';
import { AlertCircle, ShieldAlert, RotateCcw, Loader2, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activePrecharge, setActivePrecharge] = useState<Precharge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);

  // Link token security & preloaded values
  const [initialAmount, setInitialAmount] = useState<number | undefined>(undefined);
  const [isAmountLocked, setIsAmountLocked] = useState<boolean>(false);
  const [sellerMessage, setSellerMessage] = useState<string | undefined>(undefined);
  const [confirmationMessage, setConfirmationMessage] = useState<string | undefined>(undefined);
  const [concept, setConcept] = useState<string | undefined>(undefined);
  const [paymentLinkId, setPaymentLinkId] = useState<string | null>(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState<string | null>(null);
  const [qrTimeoutMinutes, setQrTimeoutMinutes] = useState<number>(15);
  const [hasPaymentLinkParam, setHasPaymentLinkParam] = useState<boolean>(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isTokenValidating, setIsTokenValidating] = useState<boolean>(false);

  // Synchronize route on popstate (browser back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Parse payment token (?c=... or ?token=...) or legacy params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // 1. Enlaces individuales desde la tabla payment_links (/l/:code o ?l=:code o ?link=:code)
    const linkPathMatch = window.location.pathname.match(/^\/l\/([a-zA-Z0-9_-]+)/);
    const linkCode = linkPathMatch ? linkPathMatch[1] : (params.get('l') || params.get('link') || params.get('lnk'));

    // Check if there is an active precharge either in URL (?p=... or ?pid=...) or in 20-minute memory
    const urlPrechargeId = params.get('p') || params.get('pid') || params.get('precharge');
    const storedSession = getActivePrechargeSession(linkCode);
    const prechargeIdToRestore = urlPrechargeId || storedSession?.publicId;

    if (prechargeIdToRestore) {
      setIsTokenValidating(true);
      getPrechargeByPublicId(prechargeIdToRestore)
        .then((pch) => {
          if (pch) {
            // If already matched or still waiting within valid window
            if (pch.status === 'MATCHED' || pch.status === 'WAITING') {
              setActivePrecharge(pch);
              savePrechargeSession(pch, linkCode);
            } else {
              clearPrechargeSession(linkCode);
            }
          }
        })
        .catch((err) => {
          console.warn('[Stayhigh] No se pudo restaurar precharge:', err);
        })
        .finally(() => {
          setIsTokenValidating(false);
        });
    }

    if (linkCode) {
      setHasPaymentLinkParam(true);
      setIsTokenValidating(true);
      getPaymentLinkByCode(linkCode)
        .then((link) => {
          if (!link) {
            setSecurityError('El enlace de cobro no existe o ha sido eliminado.');
            return;
          }
          if (link.status === 'EXPIRED' || link.status === 'CANCELLED') {
            setSecurityError(`Este enlace de cobro ya no está activo (${link.status}).`);
            return;
          }
          if (link.is_single_use && link.status === 'PAID') {
            setSecurityError('Este enlace de cobro ya fue pagado y utilizado.');
            return;
          }
          // Temporizador Maestro del Enlace: corre desde la creación incluso si no se ha abierto
          const timeoutMins = link.link_timeout_minutes || merchantConfig?.link_timeout_minutes || 60;
          let calculatedExpiresAt: string | null = null;
          if (link.expires_at) {
            calculatedExpiresAt = link.expires_at;
          } else if (link.created_at && timeoutMins > 0) {
            const createdAtMs = new Date(link.created_at).getTime();
            calculatedExpiresAt = new Date(createdAtMs + timeoutMins * 60 * 1000).toISOString();
          }

          if (calculatedExpiresAt && new Date(calculatedExpiresAt).getTime() < Date.now()) {
            setSecurityError('Este enlace de cobro ha expirado.');
            return;
          }

          setLinkExpiresAt(calculatedExpiresAt);

          // Temporizador de pantalla QR (mínimo 10 min)
          const rawQr = link.qr_timeout_minutes ||
            (link.metadata && (link.metadata as Record<string, unknown>).qr_timeout_minutes) ||
            merchantConfig?.qr_timeout_minutes ||
            15;
          setQrTimeoutMinutes(Math.max(10, Number(rawQr)));

          setPaymentLinkId(link.id);
          if (link.amount !== undefined && link.amount !== null && Number(link.amount) > 0) {
            setInitialAmount(Number(link.amount));
            setIsAmountLocked(true);
          }
          if (link.concept) {
            setConcept(link.concept);
          }
          if (link.seller_message) {
            setSellerMessage(link.seller_message);
          }
          if (link.confirmation_message) {
            setConfirmationMessage(link.confirmation_message);
          }
          if (link.device_id) {
            getMerchantConfig(link.device_id).then((cfg) => {
              if (cfg) setMerchantConfig(cfg);
            });
          }
        })
        .catch((err) => {
          setSecurityError(err instanceof Error ? err.message : 'Error al cargar el enlace');
        })
        .finally(() => {
          setIsTokenValidating(false);
        });
      return;
    }

    const token = params.get('c') || params.get('token');

    if (token) {
      setHasPaymentLinkParam(true);
      setIsTokenValidating(true);
      parseAndVerifyToken(token)
        .then((payload) => {
          if (payload.amount !== undefined) {
            setInitialAmount(payload.amount);
            setIsAmountLocked(true);
          }
          if (payload.sellerMessage) {
            setSellerMessage(payload.sellerMessage);
          } else if (payload.description) {
            setSellerMessage(payload.description);
          }
          if (payload.confirmationMessage) {
            setConfirmationMessage(payload.confirmationMessage);
          }
          if (payload.deviceId) {
            getMerchantConfig(payload.deviceId).then((cfg) => {
              if (cfg) setMerchantConfig(cfg);
            });
          }
          cleanAddressBar();
        })
        .catch((err) => {
          setSecurityError(err instanceof Error ? err.message : 'Enlace de cobro inválido');
          cleanAddressBar();
        })
        .finally(() => {
          setIsTokenValidating(false);
        });
      return;
    }

    // Fallback for legacy parameters (?amount=... & ?device=...)
    const legacyAmount = params.get('amount') || params.get('monto');
    const legacyMsg = params.get('msg') || params.get('mensaje') || params.get('desc') || params.get('descripcion');
    const legacyConfirmMsg = params.get('cmsg') || params.get('confirm_msg') || params.get('confirmacion');
    const legacyDevice = params.get('device') || params.get('store');

    if (legacyAmount) {
      setHasPaymentLinkParam(true);
      const parsed = parseFloat(legacyAmount);
      if (!isNaN(parsed) && parsed > 0) {
        setInitialAmount(parsed);
        setIsAmountLocked(true);
      }
    }
    if (legacyMsg) {
      setSellerMessage(legacyMsg);
    }
    if (legacyConfirmMsg) {
      setConfirmationMessage(legacyConfirmMsg);
    }
    if (legacyDevice) {
      getMerchantConfig(legacyDevice).then((cfg) => {
        if (cfg) setMerchantConfig(cfg);
      });
    }

    if (legacyAmount || legacyMsg || legacyConfirmMsg || legacyDevice) {
      cleanAddressBar();
    }
  }, []);

  // Load active store configuration if not yet loaded
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const possibleStore = parts[0] && parts[0] !== 'pay' && parts[0] !== 'l' && parts[0] !== 'precios' && parts[0] !== 'api' && parts[0] !== 'demo' && parts[0] !== 'checkout' ? parts[0] : undefined;
    if (possibleStore) {
      getMerchantConfig(possibleStore).then((cfg) => {
        if (cfg) setMerchantConfig(cfg);
      });
    }
  }, [currentPath]);

  // Realtime hook for the merchant screen
  const { precharge, status, isConnected, isMockMode, simulateStatus } =
    usePrechargeRealtime(activePrecharge);

  const handleCreatePrecharge = async (data: CreatePrechargeDTO) => {
    try {
      setIsCreating(true);
      setErrorMessage(null);
      // Timeout del QR: mínimo 10 minutos exigido por seguridad
      const activeQrMinutes = Math.max(10, qrTimeoutMinutes || merchantConfig?.qr_timeout_minutes || 15);

      const created = await createPrecharge({
        ...data,
        device_id: merchantConfig?.device_id || null,
        seller_message: sellerMessage || data.seller_message,
        confirmation_message: confirmationMessage || data.confirmation_message,
        concept: concept || data.concept,
        payment_link_id: paymentLinkId || data.payment_link_id,
        expires_in_minutes: activeQrMinutes,
      });
      setActivePrecharge(created);

      // Guardar en memoria por 20 minutos y actualizar el link haciéndolo más largo
      const linkMatch = window.location.pathname.match(/^\/l\/([a-zA-Z0-9_-]+)/);
      const activeLinkCode = linkMatch ? linkMatch[1] : null;
      savePrechargeSession(created, activeLinkCode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al generar el cobro.';
      setErrorMessage(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNewPrecharge = () => {
    const linkMatch = window.location.pathname.match(/^\/l\/([a-zA-Z0-9_-]+)/);
    const activeLinkCode = linkMatch ? linkMatch[1] : null;
    clearPrechargeSession(activeLinkCode);
    setActivePrecharge(null);
    setErrorMessage(null);
    setSecurityError(null);

    if (activeLinkCode) {
      navigateTo(`/l/${activeLinkCode}`);
    } else if (currentPath === '/demo' || currentPath === '/checkout') {
      navigateTo('/demo');
    } else {
      navigateTo('/');
    }
  };

  // Determine if we should show the checkout flow
  const isLinkFlow = currentPath.startsWith('/l/') || hasPaymentLinkParam;
  const isExplicitDemo = currentPath === '/demo' || currentPath === '/checkout';
  const showCheckout = isLinkFlow || isExplicitDemo || activePrecharge !== null;

  // Route matching: /pay/:publicId or /:store/pay/:publicId
  const payMatch = currentPath.match(/(?:\/([a-zA-Z0-9_-]+))?\/pay\/([a-zA-Z0-9_-]+)/);
  if (payMatch) {
    const publicId = payMatch[2] || payMatch[1];
    return (
      <div className="min-h-screen flex flex-col bg-brand-bg">
        <Navbar currentPath={currentPath} onNavigate={navigateTo} onReset={() => navigateTo('/')} minimal={true} />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
          <PublicPayPage publicId={publicId} />
        </main>
        <footer className="py-8 text-center text-xs font-medium text-brand-subtext/80 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Stayhigh • Checkout Seguro en Tiempo Real • Cifrado SSL</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigateTo}
        onReset={handleNewPrecharge}
        minimal={isLinkFlow}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        {/* Token validation spinner */}
        {isTokenValidating && (
          <div className="bg-white rounded-squircle-lg p-8 max-w-lg mx-auto shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 text-center mb-6">
            <Loader2 className="w-8 h-8 text-brand-obsidian animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-brand-obsidian">Verificando enlace seguro...</p>
          </div>
        )}

        {/* Security Error Alert */}
        {securityError && !isTokenValidating && (
          <div className="bg-white rounded-squircle-lg p-8 max-w-lg mx-auto shadow-[0_10px_35px_rgba(0,0,0,0.04)] border border-white/80 text-center mb-6">
            <div className="w-14 h-14 rounded-3xl bg-red-50 text-brand-red flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-brand-obsidian mb-2">
              Enlace alterado o inválido
            </h2>
            <p className="text-xs sm:text-sm text-brand-subtext mb-6">
              {securityError}. Por motivos de seguridad bancaria, este enlace no puede ser procesado.
            </p>
            <button
              type="button"
              onClick={handleNewPrecharge}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-obsidian text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Continuar con cobro manual</span>
            </button>
          </div>
        )}

        {/* Error Alert if creation fails */}
        {errorMessage && (
          <div className="max-w-lg mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-brand-red/30 text-brand-red flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo generar el cobro</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* VIEW ROUTER */}
        {!securityError && (
          showCheckout ? (
            /* Checkout Flow (Form / QR) */
            <div className="max-w-4xl mx-auto">
              {isExplicitDemo && !activePrecharge && (
                <div className="mb-6 text-center">
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-mint-dark bg-brand-mint/40 px-3 py-1 rounded-full">
                    Modo Demostración en Vivo
                  </span>
                  <h2 className="text-2xl font-black text-brand-obsidian mt-2">
                    Prueba el Checkout Inteligente
                  </h2>
                  <p className="text-xs sm:text-sm text-brand-subtext mt-1">
                    Completa los datos de prueba y genera el QR para experimentar la conciliación en menos de 1 segundo.
                  </p>
                </div>
              )}

              {activePrecharge && precharge ? (
                <PaymentQR
                  precharge={precharge}
                  status={status}
                  isConnected={isConnected}
                  isMockMode={isMockMode}
                  onNewPrecharge={handleNewPrecharge}
                  onSimulateStatus={simulateStatus}
                  linkExpiresAt={linkExpiresAt}
                />
              ) : (
                <PaymentForm
                  onSubmit={handleCreatePrecharge}
                  isLoading={isCreating}
                  merchantConfig={merchantConfig}
                  initialAmount={initialAmount}
                  isAmountLocked={isAmountLocked}
                  sellerMessage={sellerMessage}
                  confirmationMessage={confirmationMessage}
                  concept={concept}
                  linkExpiresAt={linkExpiresAt}
                />
              )}
            </div>
          ) : currentPath === '/precios' ? (
            /* Pricing Page */
            <PricingPage onNavigate={navigateTo} />
          ) : currentPath === '/api' || currentPath === '/docs' ? (
            /* API Docs Page */
            <ApiDocsPage onNavigate={navigateTo} />
          ) : (
            /* Default: Home / Landing Page */
            <LandingPage onNavigate={navigateTo} />
          )
        )}
      </main>

      {/* When in payment link mode (/l/...), show minimal security footer; otherwise show full marketing footer */}
      {isLinkFlow ? (
        <footer className="py-8 text-center text-xs font-medium text-brand-subtext/80 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Stayhigh • Checkout Seguro en Tiempo Real • Cifrado SSL</span>
        </footer>
      ) : (
        <Footer onNavigate={navigateTo} />
      )}
    </div>
  );
};

export default App;
