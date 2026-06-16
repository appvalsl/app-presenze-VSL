const config = window.APP_CONFIG || {};
function assertConfig(){
  if(!config.SUPABASE_URL || config.SUPABASE_URL.includes('YOUR-PROJECT-REF')) throw new Error('Config Supabase mancante. Compila js/config.js');
  if(!config.SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY.includes('YOUR_PUBLIC_ANON_KEY')) throw new Error('Anon key Supabase mancante. Compila js/config.js');
}
export async function getSupabase(){
  assertConfig();
  if(window.__supabaseClient) return window.__supabaseClient;
  const mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  window.__supabaseClient = mod.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  return window.__supabaseClient;
}
