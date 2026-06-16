# Progetto presenze aggiornato: Auth + Database

Questa cartella contiene una versione aggiornata dell'app con queste modifiche:

1. Accesso protetto con utenti Supabase Auth
2. Salvataggio delle presenze su database al posto del CSV

## Contenuto
- `index.html` interfaccia app
- `assets/styles.css` stile UI
- `js/config.js` configurazione Supabase
- `js/supabase-client.js` client Supabase
- `js/app.js` logica applicativa
- `supabase/schema.sql` schema database + policy RLS
- `supabase/seed.sql` anagrafiche linee, postazioni, operatori
- `supabase/full_setup.sql` schema + seed tutto in uno

## Setup rapido
1. Crea un progetto Supabase
2. Apri SQL Editor e incolla `supabase/full_setup.sql`
3. Vai su Authentication > Users e crea manualmente gli utenti autorizzati
4. Apri `js/config.js` e sostituisci `SUPABASE_URL` e `SUPABASE_ANON_KEY`
5. Pubblica la cartella su Netlify / Vercel / GitHub Pages

## Flusso dell'app
- login obbligatorio
- setup giornata
- caricamento operatori per linea
- modifica presenze
- salvataggio in `attendance_sessions` e `attendance_rows`

## Dataset incluso
- linee: 7
- postazioni totali: 31
- operatori: 94
