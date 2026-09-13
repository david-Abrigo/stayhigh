export const PAYMENT_SALT = 'stayhigh_secure_salt_2026';

export interface VerifiedPaymentPayload {
  deviceId: string;
  amount?: number;
  description?: string;
}

/**
 * Computes a SHA-256 signature matching the Android app's calculation.
 */
export async function computePaymentSignature(
  deviceId: string,
  amount: number,
  desc?: string
): Promise<string> {
  const formattedAmount = Number(amount).toFixed(2);
  const data = `${deviceId}:${formattedAmount}:${desc || ''}:${PAYMENT_SALT}`;
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
 * Parses and cryptographically verifies a signed payment token.
 */
export async function parseAndVerifyToken(token: string): Promise<VerifiedPaymentPayload> {
  try {
    const json = base64UrlDecode(token.trim());
    const data = JSON.parse(json);

    if (!data.d || typeof data.d !== 'string') {
      throw new Error('Token inválido: falta identificador de comercio');
    }

    // Si tiene monto, verificar firma
    if (data.a !== undefined && data.a !== null) {
      const amount = Number(data.a);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Monto inválido en el token');
      }

      if (!data.s || typeof data.s !== 'string') {
        throw new Error('Enlace sin firma de seguridad');
      }

      const expectedSignature = await computePaymentSignature(data.d, amount, data.desc);
      if (data.s !== expectedSignature) {
        throw new Error('Enlace de cobro alterado o inválido');
      }

      return {
        deviceId: data.d,
        amount: amount,
        description: data.desc || undefined,
      };
    }

    return {
      deviceId: data.d,
      description: data.desc || undefined,
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
