/**
 * Utilidad de identificación de dispositivo para enlaces de cobro exclusivos.
 * Genera y persiste un identificador criptográfico único por navegador/dispositivo.
 */

const STORAGE_KEY = 'stayhigh_device_token';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function generateRandomToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'dev_' + crypto.randomUUID();
  }
  return 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Obtiene el token único del dispositivo actual o genera uno nuevo si no existe.
 */
export function getClientDeviceToken(): string {
  let token: string | null = null;

  try {
    token = localStorage.getItem(STORAGE_KEY);
  } catch {
    // LocalStorage deshabilitado o bloqueado
  }

  if (!token) {
    token = getCookie(STORAGE_KEY);
  }

  if (!token) {
    token = generateRandomToken();
  }

  // Asegurar persistencia dual (localStorage y cookie)
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore
  }
  setCookie(STORAGE_KEY, token, 365);

  return token;
}
