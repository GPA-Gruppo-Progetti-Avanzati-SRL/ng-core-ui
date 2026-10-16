# Changelog

## [Unreleased]

## [0.2.0] — 2026-10-16

### Nuove funzionalità

- **`AutocompleteFieldComponent` (`core-autocomplete-field`)** — field del FormShell: tendina con filtro testuale (mat-autocomplete). Il testo digitato filtra le voci per etichetta o valore, senza distinzione di maiuscole. Opzioni da `options` (`KVOption[]` o signal) oppure da `lookupName`, sullo stesso endpoint dei KV picker (`/api/<coreContext>/properties/<lookupName>`, ordinate per `order`). Nel modello va la `value` della voce scelta, come nel combobox; il testo libero non viene accettato (uscendo dal campo torna la voce selezionata), il campo svuotato vale `null`. Input `placeholder` e `maxResults` (default 50); rispetta `required`/`disabled`/`readonly` dello schema.

- **Maschera di input su `TextInputFieldComponent`** — nuovo input `mask` (`0` cifra, `A` lettera, `*` lettera o cifra, `\` per un letterale; ogni altro carattere è un letterale inserito da solo mentre si scrive). La textbox mostra il valore formattato, nel modello va quello pulito (`keepMask: true` per salvare quello formattato); un valore del modello, pulito o già formattato, viene sempre mostrato con la maschera. Il cursore resta al suo posto quando si scrive in mezzo, i caratteri non ammessi vengono scartati, con maschere solo numeriche il mobile apre la tastiera numerica. Nuovi input `uppercase` (anche senza maschera, es. codice fiscale) e `placeholder`. Esportati `applyMask`/`unmaskValue` (utili anche nel `format` delle colonne del datatable) e il validatore `maskValidator({ mask, message? })` per richiedere il valore completo.

### Correzioni dalla prova sul campo

- **Toast, confirm e alert: il testo non esce più dal riquadro.** Parole lunghe senza spazi (URL, codici d'errore, JSON) ora vanno a capo (`min-w-0` + `wrap-anywhere`). Nei messaggi `isHtml` i figli restano nella larghezza: `<pre>` va a capo e le tabelle scorrono in orizzontale all'interno. Il caso è emerso provando questa versione: la sanitizzazione dell'HTML (vedi sotto) toglie gli attributi `style` inline che alcuni messaggi usavano per andare a capo. Il toast non supera più la larghezza dello schermo.
- **Confirm e alert: anche titolo ed etichette dei bottoni vanno a capo.** Un titolo o un `confirmLabel`/`cancelLabel`/`closeLabel` lunghi senza spazi uscivano dal dialog e facevano comparire una barra di scorrimento orizzontale; il testo dei bottoni finiva fuori dallo sfondo del bottone. Ora i bottoni crescono in altezza e il testo va a capo all'interno.
- **Test di layout**: `components.css` viene caricato anche nei test (generato da `npm test` e `test:ci`), così l'aspetto dei componenti è verificabile.

### Dipendenze

- Workspace allineato ad **Angular 22.2.2** (core, common, forms, router, platform-browser, material, cdk, cli, build, compiler-cli, devkit), ng-packagr 22.2.4, Tailwind 4.3.3. TypeScript resta 6.0.x (Angular 22.2 richiede `>=6.0 <6.1`; TypeScript 7 non è ancora supportato).
- `ng-add.targetVersions`: Angular/Material 22.2.2, Tailwind 4.3.3. Le peer della libreria restano `^22.0.0`.

### Sicurezza e correzioni (P0 dell'analisi 2026-10-14)

- **`redirectInterceptor` — niente più reload infinito.** Su status 0 ricarica la pagina solo se la richiesta è verso l'origin della pagina (o un `trustedOrigins`), se il browser non è offline e se non c'è già stato un reload negli ultimi 10 secondi (marker in `sessionStorage`). Negli altri casi l'errore viene propagato: con backend giù o rete assente al bootstrap ora compare `page-error`.
- **`contextInterceptor` — header solo verso l'origin della pagina.** `X-Context` e `X-AppId` non vengono più inviati a host terzi (prima l'URL completo della pagina usciva dal perimetro e l'header custom faceva fallire il preflight CORS).
- **Nuova opzione `provideGPAUICore({ trustedOrigins })`** (token `LIB_TRUSTED_ORIGINS`) per gli origin, diversi da quello della pagina, che devono ricevere gli header e il reload SSO.
- **Toast HTML — rimosso `bypassSecurityTrustHtml`.** Con `isHtml=true` il messaggio passa dalla sanitizzazione standard di Angular: la formattazione (`<b>`, `<br>`, `<a>`, …) resta, script, handler `on*` e attributi `style` vengono rimossi.
- **Datatable — `visible` delle azioni non riceve più `null`.** Un predicato come `r => r.stato === 'BOZZA'` mandava in errore la tabella. La colonna azioni compare se almeno un'azione è visibile su almeno una riga della pagina.
- **Date — nuovo `GpaDateAdapter` al posto del `NativeDateAdapter`.** Legge le date digitate nell'ordine del locale (`it`: gg/mm/aaaa; separatori `/ . -` e spazio; anno a 2 o 4 cifre) e `aaaa-mm-gg`; le date inesistenti (31/02) sono invalide. Prima `05/03/2025` diventava il 3 maggio. Le date create dal picker sono alle 12:00 locali, così in JSON non scivolano al giorno prima. Nuovo helper `toIsoDate(date)` → `'YYYY-MM-DD'`.

### Affidabilità e correttezza (P1 dell'analisi 2026-10-14)

- **404 vero per gli URL sconosciuti** — `MenuGuard` lascia passare la rotta `**`: un URL inesistente mostra `NotFoundPage` invece di `/forbidden`.
- **`ConfirmService` / `AlertService` su `MatDialog`** — funzionano in ogni layout (prima in `SimpleLayout` `await confirm()` restava appeso per sempre); più richieste si impilano e ognuna risolve la propria Promise (prima la seconda sovrascriveva la prima, che non si risolveva mai). Accessibilità nativa: `role="dialog"`/`alertdialog`, focus trap, Esc, ripristino del focus; nelle conferme `danger` il focus iniziale va su "Annulla".
- **Toast** — `SimpleLayout` ora li mostra; contenitore `aria-live="polite"`, bottone di chiusura con `aria-label`.
- **Datatable** — nuovo input `rowKey` (selezione per chiave: con un loader server-side la selezione non si perde più al refetch); `rowBackground` e l'evidenza della selezione ora si vedono (le celle non hanno più `bg-white`) e la tabella segue il tema (`bg-surface`); errore con bottone "Riprova" e nuovo output `loadError`; messaggio "Nessun dato" (input `emptyMessage`); dopo una cancellazione che svuota l'ultima pagina torna alla pagina precedente; header ordinabili accessibili da tastiera con `aria-sort`.
- **`AppSha`/`AppVersion`** — letti tramite `BUILD_INFO` con `typeof`: senza `--define` (`ng serve`, test) valgono `'dev'` invece di lanciare `ReferenceError` (che rompeva anche la pagina di errore).
- **`FormModel.submit()`** — basato su `submit()` di signal forms: non parte con validatori asincroni `pending`, ignora il doppio click mentre l'azione è in corso, marca touched tutto l'albero (non solo i campi del layout), accetta azioni async e applica ai campi gli errori server ritornati. Nuovo `FormModel.submitting`.
- **Peer dependencies reali** — `^22.0.0` per `@angular/*` (aggiunti `@angular/forms`, `@angular/cdk`, `@angular/platform-browser`) e `rxjs ^7.8.0`, non più opzionali; restano opzionali solo `tailwindcss` e `@tailwindcss/postcss`.
- **ng-add** — la classe `ui` viene aggiunta al `<body>` anche quando ha già altre classi (es. `mat-typography` dopo `ng add @angular/material`); prima la sostituzione falliva in silenzio e nessuna utility della libreria si applicava.
- **Generatori ACL** — `routes.yaml` sempre valido (gli scalari passano da `JSON.stringify`: prima una descrizione con `"` o `:` rompeva il file); un `app.actions.config.ts` con errori ferma la generazione (prima veniva ignorato e l'ACL usciva senza action); nuova opzione `--app-id=<id>` per allineare l'`appId` a quello di `environment.json`.
- **CI** — workflow `ci.yml` su PR e push su `master` (test + build); il publish esegue i test prima di pubblicare. Nuovo script `test:ci` (Chrome headless `--no-sandbox`).
- **Preflight Tailwind globale** — confermato come comportamento voluto e documentato.

### Breaking (P1)

- **Peer dependencies `^22`**: un'app su Angular 21 o precedente deve prima aggiornare Angular (`ng update @angular/core @angular/cli`) oppure installare con `--legacy-peer-deps`.
- `ConfirmService.state`/`respond()` e `AlertService.state`/`close()` non esistono più; `ConfirmComponent`/`AlertComponent` sono ora il contenuto dei dialog e non vanno messi nei template (`<core-confirm />`/`<core-alert />` vanno rimossi se presenti).
- `FormModel.submit()` ritorna `Promise<boolean>` (prima `void`) e non esegue l'azione se ci sono validatori asincroni in corso.
- Datatable: con un loader server-side e la selezione attiva va passato `rowKey`; la colonna azioni e le celle non hanno più sfondo bianco fisso.

### Qualità e manutenzione (P2 dell'analisi 2026-10-14)

- **Testi e lingua** — tutti i testi della libreria vengono da un dizionario (`CORE_LABELS_IT` / `CORE_LABELS_EN`, servizio `CoreLabelsService`) scelto da `environment.language`; override per lingua con `provideGPAUICore({ labels })`. Coperti titolo del browser, pagine di errore/404/403, layout, confirm/alert, toast, card, topbar, datatable, field, KV picker, paginator.
- **Bootstrap** — avviato da `provideGPAUICore()` con un environment initializer non bloccante, non più dal costruttore di `SystemService` (iniettarlo in un test non fa più partire chiamate HTTP); timeout configurabile (`bootstrapTimeoutMs`, default 30 s) su environment e token; la pagina di errore ha "Riprova", che ricarica allo stesso URL.
- **Accessibilità** — azioni della Topbar come `<button>` raggiungibili da tastiera; FormShell senza `direction: rtl`: ordine visivo e di tabulazione coincidono con l'ordine dei campi (con azioni inline e una sola riga incompleta i campi restano allineati a destra tramite offset); lista checkbox e radio come gruppi con etichetta (`aria-labelledby`); bottoni icona dei field con `aria-label`.
- **Field** — `CheckboxListField` rispetta `disabled`/`readonly` dello schema; `FileInputField` con `multiple` produce `File[]` con tutti i file (prima teneva solo il primo); `mimeTypeValidator` accetta wildcard (`image/*`) ed estensioni (`.pdf`) e gestisce i file con MIME vuoto; nuovo `maxFileSizeValidator`. Colori dei field dal tema (niente più `slate`/`red` fissi).
- **FullLayout** — voce di menu attiva anche sulle sotto-pagine e con query string (`routerLinkActive`).
- **`SKIP_LOADING`** — `HttpContextToken` per escludere una richiesta dal contatore di `LoadingService`.
- **`provideHttpClient` dell'app** — verificato con test: `withFetch()` e gli interceptor dell'app convivono con `provideGPAUICore()` in qualsiasi ordine.
- **Pulizie** — selettori `core-*` per layout e pagine; helper della datatable non più duplicati; `toRoutesSql` esportato; `type="button"` in `core-button` (dentro un `<form>` faceva submit); classi Tailwind inesistenti corrette; `loadKVOptions` tollera risposte `null` e non muta la risposta; `lookupName` codificato nell'URL.
- **Lint** — `angular-eslint` configurato (`npm run lint`, prefisso `core`), zero errori, eseguito in CI.
- **Template Dockerfile (ng-add)** — copia il lockfile, `.git` in `./.git`, `ASSETS_FOLDER` coerente.
- **Documentazione** — CLAUDE.md e README allineati (Angular 22, bootstrap, testi, KV picker e `coreContext`, validatori file, `encryptToken` come offuscamento).

- **`confirm()` / `alert()` con HTML** — nuova opzione `isHtml`, come per i toast: il messaggio viene reso come HTML con la sanitizzazione standard di Angular (formattazione sì, script e handler no).

- **Schematic `action`** — `schematics/generate-action/schema.json` ora è incluso nel pacchetto (mancava dagli asset di `ng-package.json`, quindi `ng generate …:action` non trovava il proprio schema).

### Breaking (P2)

- `MenuGuard`: con bootstrap fallito non reindirizza più a `/error`; lascia passare e il layout mostra la pagina di errore all'URL richiesto.
- `SystemService` non avvia più il bootstrap nel costruttore: serve `provideGPAUICore()` (già richiesto dall'ng-add) oppure una chiamata esplicita a `bootstrap()`.
- `AppSwitcherComponent`: output `close` rinominato `dismiss`.
- Selettori: `app-full-layout` → `core-full-layout` (idem right/simple), `page-error` → `core-error-page`, `page-not-found` → `core-not-found-page`, `page-forbidden` → `core-forbidden-page`.
- `FileInputField` con `multiple: true`: il valore è `File[]`.
- `TopbarComponent` è ora OnPush: `visible`/`disabled` delle azioni devono leggere signal.
- Testi cambiati: 404 e 403 ora in italiano ("Pagina non trovata", "Accesso negato"), "Logout" → "Esci"; con `language: 'en'` i testi sono in inglese.
- `KvSinglePickerConfig` e `KvSignalSinglePickerConfig` sono ora alias di tipo (non più interfacce estendibili per declaration merging).

### Breaking a runtime

- Le richieste verso host terzi non ricevono più `X-Context`/`X-AppId`: se un backend su un altro origin li usa, va dichiarato in `trustedOrigins`.
- I toast HTML perdono gli attributi `style` e qualsiasi script.
- Le date prodotte dal datepicker hanno ora l'ora a 12:00 invece di 00:00 (`getTime()` cambia, giorno/mese/anno no).

## [0.1.10] — 2026-07-28

- **bug fixing multichoice picker**, ora confermando senza aver selezionato nulla imposta il campo a null

## [0.1.9] — 2026-07-23

### Nuove funzionalità

- `cardComponent` — nuova proprietà disabled — rende la card non interattiva se l’utente non è autorizzato o se la funzionalità non è ancora implementata.

## [0.1.8] — 2026-07-13

### Nuove funzionalità

- **`mimeTypeValidator` — validatore per tipologia file** — introdotto un nuovo validatore reattivo per Signal Forms che permette di validare il MIME type di un file selezionato. Supporta messaggi di errore personalizzati e controlli su liste di tipi ammessi.

### Correzioni

- **Picker field — allineamento e stili** — migliorata la coerenza visiva e il comportamento dei componenti `LookupFieldComponent` e `FileInputFieldComponent`.
- **Validazione — miglioramento messaggi d'errore** — perfezionata la visualizzazione degli stati d'errore nei campi di input complessi.

## [0.1.7] — 2026-07-09

### Correzioni

- **Field picker (`LookupFieldComponent`, `FileInputFieldComponent`) — errori di validazione ora visibili** — i field custom del FormShell che non usano `[formField]` (quindi senza `NgControl`) non facevano mai ricalcolare l'`errorState` a Material, per cui il `mat-error` non compariva mai. Introdotto `FieldStateErrorMatcher` (interno), un `ErrorStateMatcher` control-independent che delega a un predicato `hasError = touched && invalid` basato sui signal del field state. Un `effect()` reattivo forza `updateErrorState()` a ogni cambio di `hasError()` e `afterNextRender()` sincronizza lo stato iniziale (form già invalid+touched al primo render).

- **Field picker — `NG0950` in fase di error state** — l'accesso al field state durante il ricalcolo dell'error state avveniva prima che `NgComponentOutlet` avesse applicato gli input, generando `NG0950`. Ora l'`effect()` legge prima `viewChild(MatInput)` (sempre sicuro, risolve solo dopo il render) e solo allora dereferenzia `formField`/`required`.

- **`LookupFieldComponent`, `FileInputFieldComponent` — errore mostrato all'interazione, non solo al submit** — l'aggiornamento del valore (selezione o clear) e il `focusout` marcano ora il campo come `touched`/`dirty` (`markTouched`, `updateValue`), così l'errore "campo obbligatorio" appare subito quando si esce dal campo o si cancella la selezione, senza attendere il submit.

- **`ToastComponent` — centrato orizzontalmente** — il toast è ora centrato sull'asse X (`left-1/2 -translate-x-1/2`, `items-center`) mantenendo la stessa altezza verticale (`top-17`) invece di essere ancorato a destra.

### Refactoring

- **Field components — `@ViewChild` → `viewChild()`** — sostituito il decoratore con la signal-query `viewChild()` su tutti i field per coerenza e leggibilità.
- **`DatepickerFieldComponent`** — nessun meccanismo custom di error state: il datepicker ha un `NgControl` reale via `[formField]`, quindi Material gestisce nativamente asterisco `required` e `mat-error`. Aggiunto commento esplicativo.
- **Test** — aggiunti unit test per `datepicker`, `lookup` e `file-input` (inclusi outlet spec via `NgComponentOutlet`) a copertura del comportamento di validazione.

---

## [0.1.6] — 2026-07-08

### Correzioni

- **`FormShellComponent` — fix allineamento search buttons** —  nella versione mobile i SearchButtons vanno a capo, nella versione desktop restano sulla stessa riga dei campi
---

## [0.1.5] — 2026-07-01

### Nuove funzionalità

- **`redirectInterceptor` — redirect SSO delle XHR propagati al browser** — nuovo `HttpInterceptorFn` che gestisce i redirect (es. `302` emessi da un proxy davanti al frontdoor su sessione scaduta / login SSO) che il browser segue automaticamente sulle chiamate XHR/AJAX. Quando il browser segue il `302` verso un origin diverso (SSO) che non abilita CORS, la XHR fallisce con `status 0` e l'URL di destinazione non è leggibile lato JS. L'interceptor intercetta questo caso e chiama `window.location.reload()`: la **navigazione top-level non è soggetta a CORS**, quindi il browser segue liberamente il `302` fino alla pagina di login/SSO invece di lasciare l'app in stato di errore.

  Registrato automaticamente dentro `provideGPAUICore` (`withInterceptors([contextInterceptor, redirectInterceptor, loadingInterceptor])`) ed esportato dalla public API — tutte le app consumer lo ereditano senza modifiche.

  Nota: `status 0` non è esclusivo del redirect CORS (anche rete offline / richiesta abortita lo producono), quindi in quei casi scatta comunque un reload.

---

## [0.1.4] — 2026-06-30

### Correzioni

- **`RadioButtonListFieldComponent` — fix option value** —  rimesso l'option value nel radio button
---

## [0.1.3] — 2026-06-30

### Correzioni

- **`RadioButtonListFieldComponent` — fix allineamento e dimensioni** — corretto il layout del campo radio in entrambe le modalità (`inline` e stacked). In modalità `inline` l'altezza è ora fissa a 48 px (`h-[48px]`) con `items-center`; in modalità stacked il contenitore usa `min-h-[48px]` e `py-2` per padding verticale uniforme. Il `mat-radio-group` occupa ora tutta la larghezza disponibile (`w-full`) e il gap tra le opzioni è ridotto da 6 a 5 (inline) e da 2.5 a 2 (stacked). Aggiunta la classe `leading-none` su `mat-radio-button` per eliminare il line-height ereditato che causava disallineamento verticale dell'etichetta.

---

## [0.1.2] — 2026-06-23

### Miglioramenti

- **`ComboboxFieldComponent` — supporto readonly** — quando il campo è in stato `readonly`, il pannello a tendina non si apre. Implementato tramite `ViewChild(MatSelect)` e intercettazione dell'evento `(opened)`: se `formField()().readonly()` è `true`, la select viene chiusa immediatamente. Il campo mantiene il suo aspetto visivo normale (non grigio come `disabled`), coerente con il comportamento già implementato su `LookupFieldComponent` e `DatepickerFieldComponent`.

---

## [0.1.1] — 2026-06-19

### Nuove funzionalità

- **`generate-sql` — seeding ACL via SQL (PostgreSQL e Oracle)** — nuovo script binario `bin/generate-sql.mjs` che genera `dist/caps/ui/acl.sql` per il seeding delle tabelle `opem_acl_cap_def`, `opem_acl_cap_group` e `opem_acl_cap_group_def`. Si aggiunge agli esistenti `generate-acl` (YAML) e `generate-mongo` (MongoDB).

  Supporta due dialetti tramite il flag `--dialect`:
  - `pg` (default) — `INSERT ... ON CONFLICT DO UPDATE/NOTHING` (PostgreSQL 9.5+)
  - `oracle` — `MERGE INTO ... USING (SELECT ... FROM DUAL)` (Oracle 9i+)

  ```bash
  npm run generate-sql                      # PostgreSQL
  npm run generate-sql -- --dialect=oracle  # Oracle
  ```

- **`toRoutesSql()` — nuova funzione pubblica in `routes-export`** — firma: `toRoutesSql(routes, actions?, appId?, appDescription?, dialect?: 'pg' | 'oracle')`. Il parametro `dialect` (default `'pg'`) seleziona la sintassi UPSERT. Esposta da `public-api.ts`.

### Miglioramenti

- **`ng-add` — script `generate-sql` aggiunto automaticamente** — il setup schematic aggiunge il comando `generate-sql` al `package.json` dell'app consumer insieme a `generate-acl` e `generate-mongo`.

- **`ng-add` — flag `--no-warnings` sui comandi node** — tutti e tre gli script (`generate-acl`, `generate-mongo`, `generate-sql`) invocano ora `node --no-warnings` per sopprimere i warning ESM sperimentali di Node.js.

### Correzioni

- **`README.md` — versione e dipendenze** — corretti i riferimenti a versione (`0.0.39` → `0.1.0`), Angular (`21.x` → `22.x`), Material (`21.x` → `22.x`) e TypeScript (`~5.9` → `6.x`) nella documentazione radice.

---

## [0.1.0] — 2026-06-17

### Breaking Changes

- **Angular 22** — la libreria richiede ora Angular 22. Le app consumer devono aggiornare tutte le dipendenze `@angular/*` e `@angular/material` alla versione `^22.0.1`.
- **TypeScript 6.0** — richiesto TypeScript `~6.0.3` (era `~5.9.3`).

### Aggiornamenti dipendenze

| Pacchetto | Da | A |
|---|---|---|
| `@angular/core` / `common` / `forms` / `router` | `^21.2.x` | `^22.0.1` |
| `@angular/material` / `cdk` | `^21.2.x` | `^22.0.1` |
| `@angular/build` / `cli` / `compiler-cli` | `^21.2.x` | `^22.0.1` |
| `@angular-devkit/core` / `schematics` | `^21.2.x` | `^22.0.1` |
| `@schematics/angular` | `^21.2.x` | `^22.0.1` |
| `ng-packagr` | `^21.1.0` | `^22.0.0` |
| `typescript` | `~5.9.3` | `~6.0.3` |

### Miglioramenti interni

- **`schematics/tsconfig.json`** — aggiornati `module` e `moduleResolution` da `commonjs`/`node` a `node16`/`node16`; aggiunto `"types": ["node"]` per compatibilità con TypeScript 6 e Node 16+ module resolution.

---

## [0.0.54] — 2026-06-16

### Nuove funzionalità

- **`TopbarAction` — callback `visible` e `disabled`** (`topbar.component`) — aggiunte le proprietà opzionali `visible?: () => boolean` e `disabled?: () => boolean` all'interfaccia `TopbarAction`. Il template rispetta entrambe: `visible` nasconde completamente il bottone sia nella toolbar desktop che nel menu mobile; `disabled` applica `opacity-40` e `pointer-events-none` impedendo il click senza nascondere l'azione.

### Miglioramenti

- **`DatepickerFieldComponent` — supporto readonly** — il toggle del datepicker (icona calendario) viene nascosto con `[hidden]` quando il campo è in stato `readonly` o `disabled`, rendendo il campo visivamente non modificabile in modalità visualizzazione.

- **`LookupFieldComponent` — supporto readonly** — i bottoni di apertura del dialog e di rimozione della selezione vengono nascosti con `[hidden]` quando il campo è in stato `readonly` o `disabled`. Il valore rimane visibile come testo non modificabile.

- **`SystemService.canDo` — rimozione `console.log` di debug** — rimosso un `console.log` lasciato accidentalmente nel metodo `canDo`.

---

## [0.0.53] — 2026-06-10

### Miglioramenti

- **`DatatableComponent` — font size celle e icone azioni** — aumentato il font size del testo nelle celle della tabella per migliore leggibilità; aumentate le dimensioni delle icone nei bottoni azione riga (da 12 × 12 px a 16 × 16 px) e il touch target dei bottoni (da 24 × 24 px a 28 × 28 px).

- **`FormShellComponent` — spaziatura righe e font size errori** — la spaziatura verticale tra le righe del form passa da `0.75rem` a `1rem` per una respirazione più confortevole dei campi. Il font size dei messaggi di errore di validazione è ridotto a `11px` tramite override globale `.mat-mdc-form-field-error` in `themes.scss`.

- **`ButtonComponent` — altezza e font size label** — l'altezza del bottone nella variante `iconfilled` è fissata a `2.5rem` (`!h-10`) per coerenza con gli altri bottoni. Il testo dei bottoni con label usa ora esplicitamente `text-[12px]` per uniformità tipografica.

- **`CardComponent` — font size testo bottoni** — rivisto il font size del testo nei bottoni all'interno della card per allineamento al design system.

- **Campi form — font size input uniformato** — aggiunta classe `!text-sm` sugli input di tutti i field component per garantire un font size coerente (14 px) tra le diverse tipologie di campo: `DatepickerField`, `FileInputField`, `LookupField`, `KvSinglePicker`, `KvMultiPicker`, `KvSignalSinglePicker`, `KvSignalMultiPicker`.

---

## [0.0.52] — 2026-05-26

### Nuove funzionalità

- **KV multi-picker — pre-selezione alla riapertura** — `KvMultiPickerComponent` e `KvSignalMultiPickerComponent` ripristinano ora automaticamente le voci selezionate in precedenza quando il dialog viene riaperto. `LookupFieldComponent` inietta gli ID correnti nel dialog; i picker li usano per pre-spuntare le righe corrispondenti nel datatable senza alcuna modifica richiesta al codice consumer.

- **`DatatableComponent` — input `[initialSelection]`** — nuova proprietà opzionale `initialSelection: unknown[]` (default `[]`). Permette di inizializzare la selezione del datatable con un insieme di righe pre-selezionate. Retrocompatibile: i datatable esistenti senza questa prop non cambiano comportamento.

- **`createInMemoryLoader` — protezione concorrenza e `getAll()`** — risolto il bug per cui chiamate concorrenti a `fetchAll()` prima della risposta HTTP potevano generare due richieste separate con array distinti, causando il fallimento della reference equality nella selezione. Introdotto `pendingFetch` con `shareReplay(1)` per garantire un'unica richiesta condivisa. Aggiunto metodo `getAll(): Observable<T[]>` per accedere al dataset completo senza paginazione.

- **`CoreButtonComponent` — variante `iconfilled`** — nuova variante per bottoni icona con sfondo colorato pieno. A differenza di `icon` (trasparente), `iconfilled` usa `matIconButton` con angoli arrotondati (`!rounded-lg`), sfondo pieno (`bgClass()`), dimensioni 44×44 px e touch target 36×36 px. Ideale per azioni di toolbox dove l'icona deve risaltare visivamente.

  ```html
  <core-button icon="edit" variant="iconfilled" color="primary" />
  <core-button icon="delete" variant="iconfilled" color="error" />
  ```

- **`TopbarComponent` — rendering adattivo responsive** — le azioni del topbar si adattano al breakpoint. Su schermi >= 640 px vengono mostrati i bottoni con icona e label multi-riga; su schermi < 640 px le azioni collassano in un menu `mat-menu` accessibile tramite `more_vert`. Basato su `BreakpointObserver` (CDK). Nessuna modifica all'API pubblica: `TopbarAction` invariato.

### Miglioramenti

- **`ToastComponent` — Popover API (top layer)** — `core-toast` usa ora `popover="manual"` e l'API `showPopover()/hidePopover()` del browser. Il toast entra nel CSS top layer e risulta sempre visibile sopra i dialog Angular Material (CDK 21 usa anch'esso il top layer). Un `effect()` nel costruttore chiama `hidePopover()` + `showPopover()` ad ogni cambio di `svc.messages()`. Gli stili UA del popover sono sovrascritti via `style` inline nell'`host`.

- **`ToastComponent` — spostato fuori da `<mat-sidenav-content>`** — in `FullLayoutComponent` e `RightLayoutComponent`, `<core-toast>` è ora renderizzato al di fuori di `<mat-sidenav-content>`, eliminando possibili problemi di clipping.

- **`DatatableComponent` — `isLoading` via `linkedSignal`** — `isLoading` usa ora `linkedSignal(() => this.load() != null)` invece di `signal(false)`, garantendo che lo spinner sia visibile al primo render se un loader è fornito (evita il flash senza spinner su loader sincroni con cache).

- **`DatatableComponent` — spinner condizionale per dati vuoti** — aggiunto rendering condizionale dello spinner durante il caricamento quando la tabella è vuota, coerente con il comportamento su tabelle già popolate.

- **`DatatableComponent` — allineamento icone e styling paginator** — le `mat-icon` nelle celle usano `inline-flex` per allineamento verticale corretto; padding ridondante rimosso dal `mat-paginator`; altezza del paginator e dimensioni delle icone allineate al design system.

- **`KVPicker` — `loadOptions` refactoring** — eliminata l'interfaccia wrapper `KVResponse`; `loadOptions` ritorna direttamente `KVProperty[]`, riducendo il boilerplate consumer.

- **`CobaltTheme` — density e tipografia** — riunite le dichiarazioni di density in un unico punto, rimosso codice ridondante. Riviste le impostazioni tipografiche per maggiore consistenza.

- **Campo testo e button size** — corretti font size per `TextInputFieldComponent` e dimensioni dei pulsanti per allineamento visivo uniforme.

---

## [0.0.51] — 2026-05-20

### Nuove funzionalità

- **`FormShellAction` — property `color`** — ogni bottone della shell può ora avere un colore esplicito tramite `color?: ButtonColor`. Funziona sia per le azioni `inline` che `footer`. Il default resta `'tertiary'` (comportamento precedente invariato). I valori disponibili sono gli stessi di `CoreButtonComponent`: `'primary' | 'secondary' | 'tertiary' | 'success' | 'info' | 'warn' | 'error'`.

  ```typescript
  actions: FormShellAction[] = [
    {
      label: 'Salva', icon: 'save', variant: 'filled', color: 'primary', position: 'footer',
      onClick: () => this.formModel.submit(() => this.save()),
    },
    {
      label: 'Elimina', icon: 'delete', variant: 'text', color: 'error', position: 'footer',
      onClick: () => this.delete(),
    },
    {
      label: 'Annulla', variant: 'text',
      onClick: () => this.goBack(),
    },
  ];
  ```

---

## [0.0.50] — 2026-05-19

### Nuove funzionalità

- **`DatatableComponent` — input `[data]` signal-based** — nuova sorgente dati reattiva: passare direttamente un `Signal<T[]>` (o qualsiasi `() => T[]`) senza HTTP né loader. Paginazione, ordinamento e refresh sono gestiti automaticamente ogni volta che il signal cambia, senza bisogno di chiamare `refresh()`.

  ```typescript
  readonly items = signal<User[]>([]);
  // La tabella si aggiorna automaticamente ad ogni items.set(...)
  ```

  ```html
  <core-datatable [columns]="columns" [data]="items" />
  ```

- **`createSignalLoader`** — factory alternativa da usare con `[load]` quando si preferisce il pattern loader tradizionale ma con sorgente dati signal. Supporta le stesse opzioni `filter`/`filterFn` di `createInMemoryLoader`.

  ```typescript
  readonly loader = createSignalLoader(() => this.items(), {
    filter: () => this.filterText(),
  });
  ```

- **Righe nascoste durante il caricamento** — durante il fetch HTTP (modalità `[load]`) le righe dati e i bottoni azione diventano invisibili (`visibility: hidden`), preservando l'altezza della tabella e lasciando visibile solo lo spinner overlay.

- **KV Picker — 4 componenti + 4 factory function** — picker generici per `KVOption`, in due varianti:

  **URL-based** (caricano via `GET /api/{coreContext}/properties/{lookupName}`, `createInMemoryLoader`, filtro con `refresh`):
  - `KvSinglePickerComponent` — selezione singola, chiude al click riga
  - `KvMultiPickerComponent` — selezione multipla, bottoni Annulla/Conferma

  **Signal-based** (dati come `Signal<KVOption[]>`, filtro reattivo via `computed`):
  - `KvSignalSinglePickerComponent` — selezione singola
  - `KvSignalMultiPickerComponent` — selezione multipla

  Tutti includono un campo filtro testo (ricerca "contiene" case-insensitive su `value` e `label`).

  **Factory function** per costruire `LookupDialogConfig` senza `satisfies`:

  ```typescript
  readonly tipoConfig      = kvSinglePicker({ lookupName: 'tipo-contratto' }, 'Seleziona tipo');
  readonly categorieConfig = kvMultiPicker({ lookupName: 'categoria', confirmLabel: 'Applica' }, 'Categorie');
  readonly statiConfig     = kvSignalSinglePicker({ options: this.stati }, 'Seleziona stato');
  readonly coloriConfig    = kvSignalMultiPicker({ options: signal(COLORI) }, 'Colori');
  ```

  Terzo parametro opzionale `{ width?, maxWidth? }` per dimensionare il dialog.

- **`Environment.language`** — nuova property opzionale (`"it"`, `"en"`, ecc.) in `environment.json`. Guida automaticamente:
  - **Angular Material DatePicker** — il `DateAdapter` viene aggiornato via effect non appena l'environment si carica
  - **MatPaginator labels** — testi italiani di default (`Righe per pagina:`, `Prima pagina`, `Pagina successiva`, …, `X – Y di Z`). Fornito tramite `GpaPaginatorIntl` registrato in `provideGPAUICore()`.

  Backward compatible — basta aggiungere `"language": "it"` all'`environment.json`.

- **`DatatableComponent` — row selection** — nuova feature per selezionare righe tramite `selectionMode` input. Tre modalità:
  - `'none'` (default) — comportamento invariato, zero breaking changes
  - `'single'` — radio button a sinistra, click per selezionare/deselezionare
  - `'multi'` — checkbox per riga + "select all" nell'header (agisce sulla pagina corrente), selezione persiste cross-page

  Nuova API pubblica: `selectionMode`, `selectionChange`, `selectedRows`, `clearSelection()`.

  ```html
  <core-datatable [columns]="columns" [load]="loader" selectionMode="multi"
    (selectionChange)="selected = $event" #dt />
  <button (click)="dt.clearSelection()">Deseleziona tutto</button>
  ```

- **`CoreButtonComponent` — input `color`** — nuova property `color: ButtonColor` per colorare il pulsante. Valori: `'primary' | 'secondary' | 'tertiary' | 'success' | 'info' | 'warn' | 'error'`. Default: `'tertiary'`. Colori Material usano i token del color bridge; colori semantici usano classi Tailwind fisse (`green-600`, `sky-600`, `amber-500`). Tipo `ButtonColor` esportato da `public-api`.

  ```html
  <core-button icon="save" label="Salva" />                    <!-- tertiary filled (default) -->
  <core-button icon="delete" label="Elimina" color="error" />
  <core-button icon="add" variant="icon" color="primary" />
  <core-button label="Annulla" variant="text" color="secondary" />
  ```

- **KV Picker — ordinamento automatico per `order`** — i picker URL-based ordinano i record per `KVProperty.order` (ascending) di default. Il click su un header colonna sovrascrive il default. Nessuna modifica alle app consumatrici.

### Bug fix

- **DatePicker — formato data italiano** — `provideGPAUICore()` ora include `{ provide: MAT_DATE_LOCALE, useValue: 'it' }` e `provideNativeDateAdapter()`. Il campo `core-datepicker-field` visualizza correttamente `gg/mm/aaaa` senza configurazione aggiuntiva. `DatepickerFieldComponent` non importa più `MatNativeDateModule` (eredita l'adapter dal root). L'effect `DateAdapter.setLocale()` in `SystemService` è ora funzionale.

### Miglioramenti

- **`DatatableComponent` completamente signal-based** — rimossi `ngOnInit`, `Subject<void>` e chiamate imperative `_trigger$.next()`. Pipeline HTTP via `toObservable(computed(...))` + `switchMap`. `[load]` ora facoltativo (era `input.required`). Comportamento esterno invariato.

- **`CoreButtonComponent` — refactoring stile e comportamento**:
  - `variant` default `'filled'`; `effectiveVariant` rimosso (ridondante)
  - Variante `icon` usa `matIconButton` + override Tailwind per stile filled — icona centrata correttamente
  - `FormShellComponent` passa `a.variant ?? 'filled'` per evitare che `undefined` bypassi il default del signal input

---

## [0.0.49] — 2026-05-14

### Breaking Changes

- **`MainLayoutComponent` rinominato in `FullLayoutComponent`** — impatta solo chi importa la classe direttamente (raro, poiché viene usata tramite `toRoutes()`). Il selettore cambia da `app-main-layout` a `app-full-layout`. Chi usava esplicitamente `{ layout: 'main' }` in `toRoutes()` riceverà un errore TypeScript: sostituire con `'full'`. Chi chiama `toRoutes(APP_ROUTES)` senza parametri non è impattato — il default rimane il layout completo.

### Nuove funzionalità

- **`RightLayoutComponent`** — nuovo layout intermedio tra `FullLayoutComponent` e `SimpleLayoutComponent`: include toolbar e app-switcher destro ma non la sidenav di navigazione sinistra. Attivabile con `toRoutes(APP_ROUTES, { layout: 'right' })`.

- **`AppSwitcherComponent`** (`core-app-switcher`) — componente condiviso che incapsula il pannello app-switcher destro (logo, lista app, logout, versione). Usato internamente da `FullLayoutComponent` e `RightLayoutComponent`.

- **`FileInputFieldComponent`** (`core-file-input-field`) — nuovo field component per `FormShell` con supporto drag & drop, validazione MIME type e rendering signal-compliant. Esportato da `public-api`. Inputs: `label`, `showAsRequired`, `multiple`, `acceptedMimeTypes`, `valuePlaceHolder`.

- **`ToastService` — supporto testo HTML** — i metodi `success/error/info/warning` accettano un terzo parametro `isHtml: boolean` (default `false`). Quando `true`, il messaggio viene renderizzato come HTML tramite `DomSanitizer`.

  ```typescript
  toastService.error('<b>Errore:</b> il file è troppo grande', 5000, true);
  ```

- **`ToastService` — toast persistente** — passare `duration = -1` mantiene il toast aperto fino alla chiusura manuale da parte dell'utente.

  ```typescript
  toastService.warning('Connessione assente — riprova manualmente', -1);
  ```

### Miglioramenti

- **`toRoutes()`** — il tipo del parametro `layout` è ora `'full' | 'right' | 'simple'` (era `'main' | 'simple'`). Il default rimane il layout completo (ora `'full'`).

- **`TopbarComponent`** — corretti bottoni azione e altezza toolbar.

- **`CardComponent`** — supporto layout a 3 righe.

- **Temi** — fix colori di sfondo per i temi `gpa` e `forest`; fix datepicker e dropdown nel tema `forest`.

- **Schematic `generate-action`** — aggiunto schematic per generare e gestire entry `CoreAction` in `app.actions.config.ts`.

---

## [0.0.48] — precedente

Vedere git history.
