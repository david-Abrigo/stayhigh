export const PAYMENT_SALT = 'stayhigh_secure_salt_2026';

export interface VerifiedPaymentPayload {
  deviceId: string;
  amount?: number;
  description?: string;
  sellerMessage?: string;
  confirmationMessage?: string;
}

/**
 * Computes a SHA-256 signature matching the Android app and link generator calculation.
 */
export async function computePaymentSignature(
  deviceId: string,
  amount: number,
  sellerMsg?: string,
  confirmMsg?: string
): Promise<string> {
  const formattedAmount = Number(amount).toFixed(2);
  const data = confirmMsg
    ? `${deviceId}:${formattedAmount}:${sellerMsg || ''}:${confirmMsg}:${PAYMENT_SALT}`
    : `${deviceId}:${formattedAmount}:${sellerMsg || ''}:${PAYMENT_SALT}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
}

/**
 * Decodes a Base64URL string safely in the browser.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Encodes a string to Base64URL safely in browser.
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates an ultra-short signed, tamper-proof payment link URL.
 * By default, messages live in the cloud (Supabase) and are NOT embedded in the URL to keep links short.
 */
export async function generatePaymentLink(
  baseUrl: string,
  params: {
    deviceId: string;
    amount?: number;
    sellerMessage?: string;
    confirmationMessage?: string;
    includeMessagesInUrl?: boolean;
  }
): Promise<string> {
  const payload: Record<string, unknown> = {
    d: params.deviceId,
  };

  // Solo incluir en URL si se solicita explícitamente (por defecto los mensajes viven en Supabase en la nube)
  if (params.includeMessagesInUrl) {
    if (params.sellerMessage && params.sellerMessage.trim()) {
      payload.msg = params.sellerMessage.trim();
    }
    if (params.confirmationMessage && params.confirmationMessage.trim()) {
      payload.cmsg = params.confirmationMessage.trim();
    }
  }

  if (params.amount !== undefined && params.amount > 0) {
    const fixedAmount = parseFloat(params.amount.toFixed(2));
    payload.a = fixedAmount;
    payload.s = await computePaymentSignature(
      params.deviceId,
      fixedAmount,
      payload.msg as string | undefined,
      payload.cmsg as string | undefined
    );
  }

  const json = JSON.stringify(payload);
  const token = base64UrlEncode(json);
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/?c=${token}`;
}

/**
 * Parses and cryptographically verifies a signed payment token.
 */
export async function parseAndVerifyToken(token: string): Promise<VerifiedPaymentPayload> {
  try {
    const json = base64UrlDecode(token.trim());
    const data = JSON.parse(json);

    if (!data.d || typeof data.d !== 'string') {
      throw new Error('Token inválido: falta identificador de comercio');
    }

    const sellerMsg = data.msg || data.desc || undefined;
    const confirmMsg = data.cmsg || data.confirmMsg || undefined;

    // Si tiene monto, verificar firma
    if (data.a !== undefined && data.a !== null) {
      const amount = Number(data.a);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Monto inválido en el token');
      }

      if (!data.s || typeof data.s !== 'string') {
        throw new Error('Enlace sin firma de seguridad');
      }

      const expectedSigWithConfirm = await computePaymentSignature(data.d, amount, sellerMsg, confirmMsg);
      const expectedLegacySig = await computePaymentSignature(data.d, amount, sellerMsg);

      if (data.s !== expectedSigWithConfirm && data.s !== expectedLegacySig) {
        throw new Error('Enlace de cobro alterado o inválido');
      }

      return {
        deviceId: data.d,
        amount: amount,
        description: sellerMsg,
        sellerMessage: sellerMsg,
        confirmationMessage: confirmMsg,
      };
    }

    return {
      deviceId: data.d,
      description: sellerMsg,
      sellerMessage: sellerMsg,
      confirmationMessage: confirmMsg,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al verificar enlace de pago';
    throw new Error(msg);
  }
}

/**
 * Cleans query parameters from browser address bar without reloading the page.
 */
export function cleanAddressBar(): void {
  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      // ignore
    }
  }
}
