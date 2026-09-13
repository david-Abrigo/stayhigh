import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PaymentForm } from './components/PaymentForm';
import { PaymentQR } from './components/PaymentQR';
import { PublicPayPage } from './components/PublicPayPage';
import { CreatePrechargeDTO, Precharge } from './types/payment';
import { createPrecharge, getMerchantConfig, getPaymentLinkByCode, MerchantConfig } from './services/api';
import { usePrechargeRealtime } from './hooks/usePrechargeRealtime';
import { parseAndVerifyToken, cleanAddressBar } from './services/security';
import { AlertCircle, ShieldAlert, RotateCcw, Loader2 } from 'lucide-react';

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

  // Parse payment token (?c=... or ?token=...) or legacy params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // 1. Enlaces individuales desde la tabla payment_links (/l/:code o ?l=:code o ?link=:code)
    const linkPathMatch = window.location.pathname.match(/^\/l\/([a-zA-Z0-9_-]+)/);
    const linkCode = linkPathMatch ? linkPathMatch[1] : (params.get('l') || params.get('link') || params.get('lnk'));

    if (linkCode) {
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
          if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
            setSecurityError('Este enlace de cobro ha expirado.');
            return;
          }

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
          // Cloak address bar immediately so ?c=... disappears
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
    const possibleStore = parts[0] && parts[0] !== 'pay' && parts[0] !== 'l' ? parts[0] : undefined;
    getMerchantConfig(possibleStore).then((cfg) => {
      if (cfg) setMerchantConfig(cfg);
    });
  }, [currentPath]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Realtime hook for the merchant screen
  const { precharge, status, isConnected, isMockMode, simulateStatus } =
    usePrechargeRealtime(activePrecharge);

  const handleCreatePrecharge = async (data: CreatePrechargeDTO) => {
    try {
      setIsCreating(true);
      setErrorMessage(null);
      const created = await createPrecharge({
        ...data,
        device_id: merchantConfig?.device_id || null,
        seller_message: sellerMessage || data.seller_message,
        confirmation_message: confirmationMessage || data.confirmation_message,
        concept: concept || data.concept,
        payment_link_id: paymentLinkId || data.payment_link_id,
      });
      setActivePrecharge(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al generar el cobro.';
      setErrorMessage(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleNewPrecharge = () => {
    setActivePrecharge(null);
    setErrorMessage(null);
    setSecurityError(null);
    if (currentPath !== '/') {
      navigateTo('/');
    }
  };

  // Route matching: /pay/:publicId or /:store/pay/:publicId
  const payMatch = currentPath.match(/(?:\/([a-zA-Z0-9_-]+))?\/pay\/([a-zA-Z0-9_-]+)/);
  if (payMatch) {
    const publicId = payMatch[2] || payMatch[1];
    return (
      <div className="min-h-screen flex flex-col bg-brand-bg">
        <Navbar onReset={() => navigateTo('/')} />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
          <PublicPayPage publicId={publicId} />
        </main>
      </div>
    );
  }

  // Merchant screen: Main page
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar onReset={handleNewPrecharge} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
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
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-obsidian text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition shadow-xs"
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

        {/* View Switch: Form vs QR */}
        {!securityError && (
          activePrecharge && precharge ? (
            <PaymentQR
              precharge={precharge}
              status={status}
              isConnected={isConnected}
              isMockMode={isMockMode}
              onNewPrecharge={handleNewPrecharge}
              onSimulateStatus={simulateStatus}
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
            />
          )
        )}
      </main>

      <footer className="py-6 text-center text-xs font-medium text-brand-subtext/80">
        Stayhigh &bull; Checkout Inteligente en Tiempo Real
      </footer>
    </div>
  );
};

export default App;
