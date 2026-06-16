export async function getSupabase() {exportASE_URL;
  const anonKey = cfg.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Config Supabase mancante. Controlla js/config.js');
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Libreria Supabase non caricata correttamente');
  }

  return window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

  const cfg = window.APP_CONFIG || {};
