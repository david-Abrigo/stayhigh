import { CreatePrechargeDTO, Precharge, PrechargeStatus } from '../types/payment';
import { supabase } from './supabase';

export const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// In-memory & local mock store for demo mode
const STORAGE_KEY = 'stayhigh_mock_precharges';

function getStoredMockPrecharges(): Record<string, Precharge> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredMockPrecharges(data: Record<string, Precharge>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

type MockListener = (precharge: Precharge) => void;
const mockListeners = new Set<MockListener>();

export function subscribeToMockPrecharge(targetId: string, listener: MockListener): () => void {
  const handler: MockListener = (p) => {
    if (p.id === targetId || p.public_id === targetId) {
      listener(p);
    }
  };
  mockListeners.add(handler);
  return () => {
    mockListeners.delete(handler);
  };
}

export function updateMockPrechargeStatus(targetId: string, newStatus: PrechargeStatus): Precharge | null {
  const store = getStoredMockPrecharges();
  let found: Precharge | null = null;

  for (const key of Object.keys(store)) {
    if (store[key].id === targetId || store[key].public_id === targetId) {
      store[key] = {
        ...store[key],
        status: newStatus,
        matched_at: newStatus === 'MATCHED' ? new Date().toISOString() : store[key].matched_at,
      };
      found = store[key];
      break;
    }
  }

  if (found) {
    saveStoredMockPrecharges(store);
    mockListeners.forEach((fn) => fn(found!));
  }
  return found;
}

function generateRandomPublicId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'CHK-';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createPrecharge(payload: CreatePrechargeDTO): Promise<Precharge> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutos
  const publicId = generateRandomPublicId();
  const normalizedName = payload.expected_name.trim().toUpperCase();

  // 1. Si está en Modo Simulación explícito
  if (isMockMode) {
    const randomId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'mock-' + Date.now();
    const mockItem: Precharge = {
      id: randomId,
      public_id: publicId,
      expected_name: payload.expected_name.trim(),
      expected_amount: Number(payload.expected_amount),
      currency: payload.currency || 'PEN',
      description: payload.description || null,
      status: 'WAITING',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      matched_at: null,
      metadata: {
        seller_message: payload.seller_message || null,
        confirmation_message: payload.confirmation_message || null,
        buyer_note: payload.description || null,
        mock: true,
        ...(payload.metadata || {}),
      },
      device_id: payload.device_id || null,
    };

    const store = getStoredMockPrecharges();
    store[publicId] = mockItem;
    saveStoredMockPrecharges(store);
    return mockItem;
  }

  // 2. Subida directa a la tabla precharges de Supabase
  if (supabase) {
    const recordToInsert: Record<string, unknown> = {
      public_id: publicId,
      expected_name: payload.expected_name.trim(),
      expected_name_normalized: normalizedName,
      expected_amount: Number(payload.expected_amount),
      currency: payload.currency || 'PEN',
      description: payload.description || null,
      status: 'WAITING' as const,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      matched_notification_id: null,
      matched_at: null,
      metadata: {
        seller_message: payload.seller_message || null,
        confirmation_message: payload.confirmation_message || null,
        buyer_note: payload.description || null,
        ...(payload.metadata || {}),
      },
      device_id: payload.device_id || null,
    };

    if (payload.seller_message) {
      recordToInsert.seller_message = payload.seller_message;
    }
    if (payload.confirmation_message) {
      recordToInsert.confirmation_message = payload.confirmation_message;
    }

    let { data, error } = await supabase
      .from('precharges')
      .insert(recordToInsert)
      .select()
      .single();

    // Fallback si las columnas aún no existen en Supabase (error 42703)
    if (error && error.code === '42703') {
      delete recordToInsert.seller_message;
      delete recordToInsert.confirmation_message;
      const retry = await supabase
        .from('precharges')
        .insert(recordToInsert)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[Stayhigh] Error al insertar en Supabase precharges:', error);
      if (error.code === '42501') {
        throw new Error(
          'Permiso denegado por Row Level Security (RLS) en Supabase. Asegúrate de ejecutar en el SQL Editor de Supabase: CREATE POLICY "Allow precharges insert for anon" ON precharges FOR INSERT TO anon WITH CHECK (true);'
        );
      }
      throw new Error(`Error en Supabase (${error.code}): ${error.message}`);
    }

    return data as Precharge;
  }

  // 3. Fallback a Backend si estuviera configurado
  if (apiUrl && !apiUrl.includes('tu-backend')) {
    const endpoint = `${apiUrl}/api/precharges`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expected_name: payload.expected_name,
        expected_amount: Number(payload.expected_amount),
        currency: payload.currency || 'PEN',
        description: payload.description || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Error al crear el cobro');
      throw new Error(`Error en servidor (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  throw new Error('No hay conexión con Supabase ni backend configurado.');
}

export async function getPrechargeByPublicId(publicId: string): Promise<Precharge | null> {
  if (isMockMode) {
    const store = getStoredMockPrecharges();
    if (store[publicId]) {
      return store[publicId];
    }
    const fallback: Precharge = {
      id: 'demo-uuid-' + publicId,
      public_id: publicId,
      expected_name: 'Cliente Demo',
      expected_amount: 25.0,
      currency: 'PEN',
      description: 'Pago demostración',
      status: 'WAITING',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
    store[publicId] = fallback;
    saveStoredMockPrecharges(store);
    return fallback;
  }

  // Consulta directa a Supabase por public_id
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('precharges')
        .select('*')
        .eq('public_id', publicId)
        .maybeSingle();

      if (!error && data) {
        return data as Precharge;
      }
    } catch (err) {
      console.warn('[Stayhigh] Error consultando Supabase precharge:', err);
    }
  }

  // Fallback a API si existe
  if (apiUrl && !apiUrl.includes('tu-backend')) {
    try {
      const res = await fetch(`${apiUrl}/api/precharges/${encodeURIComponent(publicId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export interface MerchantConfig {
  id?: string;
  device_id?: string | null;
  merchant_name?: string | null;
  merchant_tag?: string | null;
  qr_image_url?: string | null;
  seller_message?: string | null;
  confirmation_message?: string | null;
  welcome_message?: string | null;
  updated_at?: string | null;
}

export async function getMerchantConfig(storeIdentifier?: string): Promise<MerchantConfig | null> {
  if (!supabase) return null;
  try {
    let query = supabase.from('merchant_config').select('*');

    if (storeIdentifier && storeIdentifier !== 'main') {
      query = query.or(`id.eq.${storeIdentifier},device_id.eq.${storeIdentifier}`);
    } else {
      // Check query parameter in URL (e.g. ?store=tienda-1 or ?device=uuid)
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramStore = urlParams ? urlParams.get('store') || urlParams.get('device') || urlParams.get('tienda') : null;
      const savedStore = typeof localStorage !== 'undefined' ? localStorage.getItem('stayhigh_selected_store') : null;
      const target = paramStore || savedStore;

      if (target && target !== 'main') {
        query = query.or(`id.eq.${target},device_id.eq.${target}`);
      } else {
        // Fallback to most recently updated configuration
        query = query.order('updated_at', { ascending: false }).limit(1);
      }
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data) {
      if (typeof localStorage !== 'undefined' && data.id) {
        localStorage.setItem('stayhigh_selected_store', data.id);
      }
      return data as MerchantConfig;
    }
  } catch (err) {
    console.warn('[Stayhigh] Error consultando merchant_config:', err);
  }
  return null;
}

export async function updateMerchantMessages(
  storeId: string,
  sellerMessage: string,
  confirmationMessage: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase no está inicializado' };
  try {
    const { error } = await supabase
      .from('merchant_config')
      .update({
        seller_message: sellerMessage.trim() || null,
        confirmation_message: confirmationMessage.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      if (error.code === '42703') {
        return {
          success: false,
          error:
            'Las columnas aún no existen en merchant_config. Ejecuta el script supabase_add_messages_columns.sql en tu Supabase SQL Editor.',
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar mensajes';
    return { success: false, error: msg };
  }
}


