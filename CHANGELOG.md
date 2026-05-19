# Changelog

## [Unreleased]

### Nuove funzionalità

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
  - **Angular Material DatePicker** — il `DateAdapter` viene aggiornato via effect non appena l'environment si carica (formato date: gg/mm/aaaa in italiano)
  - **MatPaginator labels** — testi italiani di default (`Righe per pagina:`, `Prima pagina`, `Pagina successiva`, …, `X – Y di Z`). Fornito tramite `GpaPaginatorIntl` registrato in `provideGPAUICore()`.

  Nessuna modifica richiesta nelle app consumatrici esistenti (backward compatible). Basta aggiungere `"language": "it"` all'`environment.json`.

- **`DatatableComponent` — row selection** — nuova feature per selezionare righe tramite `selectionMode` input. Tre modalità:
  - `'none'` (default) — comportamento invariato, zero breaking changes
  - `'single'` — radio button a sinistra, click per selezionare/deselezionare
  - `'multi'` — checkbox per riga + "select all" nell'header (agisce sulla pagina corrente), selezione persiste cross-page

  Nuova API pubblica:
  - `selectionMode = input<DatatableSelectionMode>('none')`
  - `selectionChange = output<unknown[]>()` — emette ad ogni cambio
  - `selectedRows: Signal<unknown[]>` — signal readonly accessibile via `@ViewChild`
  - `clearSelection()` — resetta la selezione (utile dopo azioni bulk)

  ```html
  <core-datatable
    [columns]="columns"
    [load]="loader"
    selectionMode="multi"
    (selectionChange)="selected = $event"
    #dt
  />
  <button (click)="dt.clearSelection()">Deseleziona tutto</button>
  ```

## [0.0.50] — 2026-05-18

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

- **Righe nascoste durante il caricamento** — durante il fetch HTTP (modalità `[load]`) le righe dati e i bottoni azione diventano invisibili (`visibility: hidden`), preservando l'altezza della tabella e lasciando visibile solo lo spinner overlay. Le righe riappaiono al completamento del caricamento.

### Miglioramenti interni

- **`DatatableComponent` completamente signal-based** — rimossi `ngOnInit`, `Subject<void>` e tutte le chiamate imperative `_trigger$.next()`. La pipeline di caricamento HTTP ora usa `toObservable(computed(...))` + `switchMap` nel costruttore. La dimensione pagina è ora un `linkedSignal` da `initialPageSize`. Comportamento esterno invariato.

- **`[load]` ora facoltativo** — era `input.required`, ora `input<DatatableLoader | null>(null)`. I template esistenti con `[load]="..."` continuano a funzionare senza modifiche.

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
