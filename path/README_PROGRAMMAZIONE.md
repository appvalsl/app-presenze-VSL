# Programmazione produzione manovie - V3

Questa versione corregge il flusso dell editor e il salvataggio del database programma.

## Modifiche V3

- Cliccando **Crea programma** l utente vede prima il blocco **Seleziona il periodo**.
- Dopo aver scelto il periodo e premuto **Apri editor periodo**, l editor mostra tutte le date incluse nel periodo. Esempio: dal 07/07 al 09/07 mostra 07/07, 08/07 e 09/07.
- I parziali in alto sono stati rimossi.
- I parziali sono ora dentro la stessa tabella editor:
  - Parziale VSL1
  - Parziale VSL2
  - Totale generale
- Il salvataggio del programma e ora in formato giornaliero:
  - DATA
  - CODICI
  - QUANTITA
- Il database programma legge la nuova tabella giornaliera `production_program_daily_rows`.

## SQL da eseguire

Se parti da zero, esegui:

```text
sql/2026_07_08_programmazione_magazzino_forme.sql
```

Se invece avevi gia eseguito la versione precedente, puoi eseguire solo:

```text
sql/2026_07_08_programmazione_daily_rows.sql
```

## Abilitare utenti alla Programmazione

```sql
update public.app_users
set can_manage_programming = true
where lower(email) = lower('nome.cognome@azienda.it');
```

Gli admin con `can_manage_operators = true` o ruolo `admin/superadmin` vedono anche il Magazzino Forme.

## Flusso corretto

```text
Programmazione
-> Crea programma
-> Seleziona il periodo
-> Apri editor periodo
-> Aggiungi righe VSL1/VSL2
-> Inserisci articolo / MOD VAR / MOD
-> Compila quantità sui giorni
-> Salva programma
```

Il salvataggio crea righe giornaliere nella nuova tabella, quindi il database programma non ragiona piu solo come periodo dal/al, ma come elenco di righe DATA/CODICI/QUANTITA.

## Fix V3.1 date locali

Corretto bug fuso orario/browser: ora il periodo viene calcolato con date locali e non con `toISOString()`, quindi dal 14/07 al 17/07 resta 14/07, 15/07, 16/07, 17/07 e non scala al giorno precedente.

## Fix V3.2 export live e articolo mostrato

- Sotto l editor sono stati aggiunti due pulsanti:
  - **Scarica Excel layout editor**: scarica un file `.xls` con il layout visuale del programma manovia.
  - **Stampa / PDF editor**: apre una versione stampabile del layout, da salvare come PDF dal browser.
- Nel Database programma la colonna **Articolo** ora mostra prima il codice effettivamente inserito dall utente nel programma manovia (`lookup_code`), non il codice modello recuperato dal magazzino forme.
- I nuovi salvataggi giornalieri salvano `article_code` con il valore inserito dall utente.

## Fix V3.3 reset, modifica programmi e FTE

- Aggiunto pulsante **Reset editor**: ripulisce le righe, svuota il programma corrente e permette di cambiare periodo/data senza restare agganciati al vecchio editor.
- Nel **Database programma** ora compare anche l elenco dei programmi inseriti. Ogni programma ha il pulsante **Modifica**.
- Cliccando **Modifica**, il programma viene riaperto nell editor con le righe precedenti. Premendo **Aggiorna programma**, le righe giornaliere precedenti vengono eliminate e sostituite con quelle nuove.
- Sotto **Parziale VSL1** e **Parziale VSL2** sono state aggiunte le righe:
  - FTE reali programmabili VSL1
  - FTE reali programmabili VSL2
- Gli FTE reali sono calcolati leggendo operatori e assenze programmate del periodo selezionato.
