# VSL Operations Workforce - versione multipagina

Questa versione mantiene i file e la logica esistenti, ma aggiunge pagine HTML separate per le aree principali.

## Pagine disponibili

- `index.html` -> Dashboard
- `pages/presenze.html` -> Presenze
- `pages/assenze-programmate.html` -> Assenze programmate
- `pages/riepilogo-presenze.html` -> Riepilogo presenze
- `pages/gestione-applicazione.html` -> Gestione applicazione
- `pages/programmazione.html` -> Programmazione
- `pages/tempi-metodi.html` -> Tempi e Metodi

## File aggiunto

- `js/page-router.js`

Il router apre automaticamente la sezione corretta nella pagina dedicata e trasforma i pulsanti principali del menu in navigazione reale tra pagine HTML.

## Nota importante

Per ridurre il rischio di regressioni, la logica originale e i file principali sono stati mantenuti. La separazione e' stata fatta a livello di pagine/URL reali, senza eliminare funzioni esistenti.


## V2

- Fix click su Assenze programmate dalla Home.
- Nelle pagine interne i pulsanti principali della topbar vengono nascosti: restano solo utente/logout.


## V3

- Ripristinati i pulsanti nel menu superiore.
- Nascosti i pulsanti/card della Home dentro le singole pagine.
- Forzata la visualizzazione della sezione corretta in base alla pagina aperta.
