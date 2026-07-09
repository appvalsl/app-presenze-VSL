(function () {
  'use strict';

  function isConfigured(config) {
    return Boolean(
      config &&
      typeof config.SUPABASE_URL === 'string' &&
      typeof config.SUPABASE_ANON_KEY === 'string' &&
      config.SUPABASE_URL.startsWith('https://') &&
      !config.SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
      !config.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
    );
  }

  const config = window.APP_CONFIG || {};
  const configured = isConfigured(config);
  let client = null;

  if (configured) {
    client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  window.AppSupabase = {
    client,
    configured,
    getClient() {
      return client;
    },
    isConfigured() {
      return configured;
    }
  };
})();



