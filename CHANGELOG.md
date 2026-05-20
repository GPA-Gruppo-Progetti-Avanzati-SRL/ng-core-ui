# Changelog

## [Unreleased]

---

## [0.0.52] — 2026-05-20

### Nuove funzionalità

- **KV multi-picker — pre-selezione alla riapertura** — `KvMultiPickerComponent` e `KvSignalMultiPickerComponent` ripristinano ora automaticamente le voci selezionate in precedenza quando il dialog viene riaperto. `LookupFieldComponent` inietta gli ID correnti nel dialog; i picker li usano per pre-spuntare le righe corrispondenti nel datatable senza alcuna modifica richiesta al codice consumer.

- **`DatatableComponent` — input `[initialSelection]`** — nuova proprietà opzionale `initialSelection: unknown[]` (default `[]`). Permette di inizializzare la selezione del datatable con un insieme di righe pre-selezionate. Retrocompatibile: i datatable esistenti senza questa prop non cambiano comportamento.

- **`createInMemoryLoader` — protezione concorrenza e `getAll()`** — risolto il bug per cui chiamate concorrenti a `fetchAll()` prima della risposta HTTP potevano generare due richieste separate con array distinti, causando il fallimento della reference equality nella selezione. Introdotto `pendingFetch` con `shareReplay(1)` per garantire un'unica richiesta condivisa. Aggiunto metodo `getAll(): Observable<T[]>` per accedere al dataset completo senza paginazione.

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
