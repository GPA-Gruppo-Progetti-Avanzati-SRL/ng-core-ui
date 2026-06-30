# Changelog

## [Unreleased]

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
