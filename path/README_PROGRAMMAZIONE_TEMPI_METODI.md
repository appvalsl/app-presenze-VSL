# Programmazione + Tempi e Metodi

## Nuove sezioni

- **Programmazione**: crea, modifica, esporta e consulta programmi manovia.
- **Tempi e Metodi**: sezione admin per caricare la tabella `ARTICOLI LAVORAZIONI TEMPI CICLI DI PRODUZIONE`.

## Logica tempi

Nel programma manovia l'utente puo inserire:

- ARTICOLO completo: il sistema prende dal sesto carattere 6 caratteri, trasformandolo in MOD VAR.
- MOD VAR da 6 caratteri: il sistema cerca quel valore nella colonna `articolo` della tabella tempi.
- MOD da 3 caratteri: il sistema cerca quel valore nella colonna `mod`.
- Se non trova nulla, usa come fallback il tempo medio del `393VOD`.

Il tempo unitario considera solo le fasi:

- Caricamento manovia
- Montaggio
- Preparazione alla suolatura
- Suolatura

Il tempo totale giornaliero e calcolato come:

```text
tempo unitario articolo * quantita del giorno
```

## SQL

Eseguire in Supabase SQL Editor:

```text
sql/2026_07_08_programmazione_tempi_metodi.sql
```

## File principali aggiunti

- `js/programmazione.js`
- `js/tempi-metodi.js`
- `sql/2026_07_08_programmazione_tempi_metodi.sql`

## Aggiornamento import Tempi e Metodi

Il caricamento tempi ora supporta direttamente il file:

```text
VSL Bucine - Tempi cicli di lavorazione per articolo.xlsx
```

Il sistema legge il foglio:

```text
Articoli_lavorazioni
```

E importa le colonne:

```text
Articolo
Test
Fase
Lavorazione
Tempo medio di lavorazione (s)
```

Le colonne calcolate rimangono:

```text
MOD = primi 3 caratteri di Articolo
TEMPO = Test * Tempo medio di lavorazione (s)
```
