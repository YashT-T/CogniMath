import { createClient } from '@supabase/supabase-js';

/* Supabase client. It is null when the two environment variables are missing,
   and the app then works exactly as before (no login page, progress kept in this browser). */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function currentUser() {
  if (!supabase) return null;
  try { const { data } = await supabase.auth.getSession(); return data.session ? data.session.user : null; } catch (e) { return null; }
}
