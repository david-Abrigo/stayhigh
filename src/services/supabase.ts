import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Sanitize URL in case it includes /rest/v1 suffix
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (error) {
    console.warn('[Stayhigh] Supabase client initialization error:', error);
  }
} else {
  console.warn('[Stayhigh] Supabase credentials not set or incomplete. Running in offline/mock compatible mode.');
}

export const supabase = client;
