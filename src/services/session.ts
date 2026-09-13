import { Precharge } from '../types/payment';

export interface StoredSession {
  publicId: string;
  id?: string;
  linkCode: string | null;
  expectedName?: string;
  expectedAmount?: number;
  status?: string;
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 20 * 60 * 1000; // 20 minutos de memoria persistente

function getStorageKey(linkCode?: string | null): string {
  return `stayhigh_session_${linkCode ? linkCode.toLowerCase() : 'default'}`;
}

/**
 * Guarda la sesión de cobro activo en localStorage y actualiza la barra de direcciones
 * para hacer el enlace más largo y persistente durante 20 minutos.
 */
export function savePrechargeSession(precharge: Precharge, linkCode?: string | null): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const sessionData: StoredSession = {
    publicId: precharge.public_id,
    id: precharge.id,
    linkCode: linkCode || null,
    expectedName: precharge.expected_name,
    expectedAmount: precharge.expected_amount,
    status: precharge.status,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  try {
    localStorage.setItem(getStorageKey(linkCode), JSON.stringify(sessionData));
    localStorage.setItem('stayhigh_last_session', JSON.stringify(sessionData));
  } catch (e) {
    console.warn('[Stayhigh] No se pudo guardar la sesión en almacenamiento local:', e);
  }

  // Actualiza la URL agregando más valores sin recargar la página
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('p', precharge.public_id);
    url.searchParams.set('t', now.toString());
    window.history.replaceState({ prechargeId: precharge.public_id }, '', url.toString());
  } catch (e) {
    console.warn('[Stayhigh] Error actualizando URL:', e);
  }
}

/**
 * Recupera una sesión activa si aún no han pasado los 20 minutos.
 */
export function getActivePrechargeSession(linkCode?: string | null): StoredSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const specificKey = getStorageKey(linkCode);
    const raw = localStorage.getItem(specificKey) || localStorage.getItem('stayhigh_last_session');
    if (!raw) return null;

    const data: StoredSession = JSON.parse(raw);

    // Validar coincidencia de código de enlace si aplica
    if (linkCode && data.linkCode && data.linkCode.toLowerCase() !== linkCode.toLowerCase()) {
      return null;
    }

    // Verificar si ya pasaron los 20 minutos
    if (Date.now() > data.expiresAt) {
      clearPrechargeSession(linkCode);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Limpia la sesión de memoria y restaura la URL limpia.
 */
export function clearPrechargeSession(linkCode?: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(getStorageKey(linkCode));
    localStorage.removeItem('stayhigh_last_session');
  } catch {
    // ignore
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    url.searchParams.delete('pid');
    url.searchParams.delete('t');
    window.history.replaceState({}, '', url.toString());
  } catch {
    // ignore
  }
}
