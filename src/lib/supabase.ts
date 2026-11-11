import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// No real credentials baked in => the app runs entirely from the localStorage
// demo seed. This is what keeps the static portfolio build working offline.
export const isDemoMode =
  !env.VITE_SUPABASE_URL ||
  supabaseUrl === 'https://placeholder.supabase.co' ||
  !env.VITE_SUPABASE_ANON_KEY ||
  supabaseAnonKey === 'placeholder-key';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
