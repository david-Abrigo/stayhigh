import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PaymentForm } from './components/PaymentForm';
import { PaymentQR } from './components/PaymentQR';
import { PublicPayPage } from './components/PublicPayPage';
import { CreatePrechargeDTO, Precharge } from './types/payment';
import { createPrecharge, getMerchantConfig, MerchantConfig } from './services/api';
import { usePrechargeRealtime } from './hooks/usePrechargeRealtime';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [activePrecharge, setActivePrecharge] = useState<Precharge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);

  // Synchronize route on popstate (browser back/forward)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Load active store configuration
  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const possibleStore = parts[0] && parts[0] !== 'pay' ? parts[0] : undefined;
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
        {activePrecharge && precharge ? (
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
          />
        )}
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        Stayhigh &bull; Sistema de gestión de cobros y precharges
      </footer>
    </div>
  );
};

export default App;
