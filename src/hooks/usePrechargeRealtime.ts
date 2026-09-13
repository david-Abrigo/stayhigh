import { useEffect, useState } from 'react';
import { Precharge, PrechargeStatus } from '../types/payment';
import { supabase } from '../services/supabase';
import { isMockMode, subscribeToMockPrecharge, updateMockPrechargeStatus } from '../services/api';

export function usePrechargeRealtime(initialPrecharge: Precharge | null) {
  const [currentPrecharge, setCurrentPrecharge] = useState<Precharge | null>(initialPrecharge);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Synchronize when initialPrecharge changes
  useEffect(() => {
    setCurrentPrecharge(initialPrecharge);
  }, [initialPrecharge?.id, initialPrecharge?.public_id]);

  useEffect(() => {
    if (!currentPrecharge) {
      setIsConnected(false);
      return;
    }

    // 1. In Mock Mode: Listen to simulated events
    if (isMockMode) {
      setIsConnected(true);
      const unsubscribe = subscribeToMockPrecharge(currentPrecharge.public_id, (updated) => {
        setCurrentPrecharge((prev) => (prev ? { ...prev, ...updated } : updated));
      });
      return () => {
        unsubscribe();
      };
    }

    // 2. In Real Mode: Connect to Supabase Realtime channel
    const client = supabase;
    if (!client) {
      console.warn('[Stayhigh] Supabase not initialized, realtime disabled.');
      return;
    }

    // Consulta inicial única al montar por si el cobro ya cambió de estado en Supabase
    if (currentPrecharge.id || currentPrecharge.public_id) {
      const query = client.from('precharges').select('*');
      if (currentPrecharge.id) {
        query.eq('id', currentPrecharge.id);
      } else {
        query.eq('public_id', currentPrecharge.public_id);
      }
      query.maybeSingle().then(({ data, error }) => {
        if (!error && data && data.status) {
          setCurrentPrecharge((prev) => (prev ? { ...prev, ...data } : data));
        }
      });
    }

    const channelName = `realtime_precharges_${currentPrecharge.id || currentPrecharge.public_id}`;
    const filterCondition = currentPrecharge.id
      ? `id=eq.${currentPrecharge.id}`
      : `public_id=eq.${currentPrecharge.public_id}`;

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE o DELETE
          schema: 'public',
          table: 'precharges',
          filter: filterCondition,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const updated = payload.new as Precharge;
            setCurrentPrecharge((prev) => (prev ? { ...prev, ...updated } : updated));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [currentPrecharge?.id, currentPrecharge?.public_id]);

  const simulateStatus = (status: PrechargeStatus) => {
    if (!isMockMode || !currentPrecharge) return;
    const updated = updateMockPrechargeStatus(currentPrecharge.public_id, status);
    if (updated) {
      setCurrentPrecharge({ ...updated });
    }
  };

  return {
    precharge: currentPrecharge,
    status: currentPrecharge?.status ?? 'WAITING',
    isConnected,
    isMockMode,
    simulateStatus,
  };
}
