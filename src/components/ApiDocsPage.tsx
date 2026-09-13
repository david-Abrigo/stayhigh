import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Server,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2
} from 'lucide-react';

interface ApiDocsPageProps {
  onNavigate: (path: string) => void;
}

export const ApiDocsPage: React.FC<ApiDocsPageProps> = ({ onNavigate }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'curl' | 'js' | 'python'>('curl');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets = {
    createPrecharge: {
      curl: `curl -X POST https://stayhigh.onrender.com/api/precharges \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "expected_amount": 25.50,
    "expected_name": "Juan Perez",
    "concept": "Orden #1084",
    "expires_in_minutes": 15
  }'`,
      js: `const response = await fetch('https://stayhigh.onrender.com/api/precharges', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    expected_amount: 25.50,
    expected_name: 'Juan Perez',
    concept: 'Orden #1084',
    expires_in_minutes: 15
  })
});

const precharge = await response.json();
console.log('Cobro creado:', precharge.id, precharge.checkout_url);`,
      python: `import requests

url = "https://stayhigh.onrender.com/api/precharges"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
payload = {
    "expected_amount": 25.50,
    "expected_name": "Juan Perez",
    "concept": "Orden #1084",
    "expires_in_minutes": 15
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
    },
    webhook: `{
  "event": "PAYMENT_MATCHED",
  "data": {
    "precharge_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "MATCHED",
    "amount": 25.50,
    "detected_name": "JUAN PER*",
    "matched_at": "2026-09-13T18:45:00Z",
    "concept": "Orden #1084"
  }
}`
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pt-6">
      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-mint-dark bg-brand-mint/40 px-3 py-1 rounded-full">
          Desarrolladores & API
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-obsidian tracking-tight mt-3 mb-4">
          Integra cobros en tiempo real en minutos
        </h1>
        <p className="text-sm sm:text-base text-brand-subtext leading-relaxed">
          Diseñado para desarrolladores. Crea cobros, consulta estados en vivo y recibe webhooks automáticos cuando el dinero ingrese a tu cuenta.
        </p>
      </div>

      {/* QUICK HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-white/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-brand-mint text-brand-obsidian flex items-center justify-center mb-2">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-brand-obsidian">Webhooks en Tiempo Real</h4>
          <p className="text-xs text-brand-subtext mt-1">
            Recibe un ping POST instantáneo en tu servidor apenas se verifique el pago.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-white/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#B7A6FC] text-brand-obsidian flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-brand-obsidian">Algoritmo Yape Masked</h4>
          <p className="text-xs text-brand-subtext mt-1">
            Reconciliación nativa para nombres con asterisco (ej. "Milagros Qui*").
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-white/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-brand-obsidian text-white flex items-center justify-center mb-2">
            <Smartphone className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-brand-obsidian">Android APK Listener</h4>
          <p className="text-xs text-brand-subtext mt-1">
            Conexión directa vía Supabase Realtime con latencia menor a 500ms.
          </p>
        </div>
      </div>

      {/* ENDPOINT: CREAR COBRO */}
      <div className="bg-white rounded-squircle-lg p-6 sm:p-8 border border-white/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                POST
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-brand-obsidian">
                /api/precharges
              </span>
            </div>
            <p className="text-xs text-brand-subtext mt-1">
              Crea una intención de cobro con monto y nombre esperado.
            </p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            {(['curl', 'js', 'python'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition uppercase cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-brand-obsidian text-white shadow-xs'
                    : 'text-brand-subtext hover:text-brand-obsidian'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Code Box */}
        <div className="relative bg-[#1C1D21] text-gray-200 p-4 sm:p-5 rounded-2xl font-mono text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => copyToClipboard(codeSnippets.createPrecharge[selectedLang], 'createPrecharge')}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Copiar código"
          >
            {copiedKey === 'createPrecharge' ? (
              <Check className="w-4 h-4 text-brand-mint" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <pre className="pr-10">{codeSnippets.createPrecharge[selectedLang]}</pre>
        </div>

        {/* Parameters Table */}
        <div className="mt-6 border-t border-black/[0.06] pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-obsidian mb-3">
            Parámetros del Body
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-brand-bg/30">
              <span className="font-mono font-bold text-brand-obsidian">expected_amount <span className="text-red-500">*number</span></span>
              <span className="text-brand-subtext">Monto exacto a cobrar en Soles (ej: 25.50).</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-brand-bg/30">
              <span className="font-mono font-bold text-brand-obsidian">expected_name <span className="text-red-500">*string</span></span>
              <span className="text-brand-subtext">Nombre del cliente registrado en su Yape/Plin.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-brand-bg/30">
              <span className="font-mono font-bold text-brand-obsidian">concept <span className="text-gray-400">string</span></span>
              <span className="text-brand-subtext">Descripción o ID de la orden interna.</span>
            </div>
          </div>
        </div>
      </div>

      {/* WEBHOOKS */}
      <div className="bg-white rounded-squircle-lg p-6 sm:p-8 border border-white/80 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 font-mono text-xs font-bold">
            WEBHOOK
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-brand-obsidian">
            Evento: PAYMENT_MATCHED
          </span>
        </div>
        <p className="text-xs text-brand-subtext mb-4">
          Enviado a tu endpoint HTTP tan pronto como la notificación bancaria sea validada.
        </p>

        <div className="relative bg-[#1C1D21] text-gray-200 p-4 sm:p-5 rounded-2xl font-mono text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => copyToClipboard(codeSnippets.webhook, 'webhook')}
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Copiar código"
          >
            {copiedKey === 'webhook' ? (
              <Check className="w-4 h-4 text-brand-mint" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <pre className="pr-10">{codeSnippets.webhook}</pre>
        </div>
      </div>

      {/* CALL TO ACTION */}
      <div className="bg-[#98F5A6] p-8 rounded-squircle-lg text-brand-obsidian text-center shadow-xs">
        <h3 className="text-2xl font-black mb-2">¿Listo para probar el checkout en vivo?</h3>
        <p className="text-xs sm:text-sm text-brand-obsidian/80 max-w-md mx-auto mb-6">
          Experimenta la validación en tiempo real con nuestra demostración interactiva en el navegador.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/demo')}
          className="px-6 py-3.5 rounded-2xl bg-brand-obsidian text-white font-black text-xs uppercase tracking-wider hover:bg-black transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
        >
          <span>ABRIR DEMO INTERACTIVO</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
