# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 22 monorepo containing **ng-core-ui** (v0.1.x), a reusable UI component library for GPA (Gruppo Progetti Avanzati) internal applications. It is published via ng-packagr and consumed by other Angular apps.

## Commands

```bash
# Build library + schematics (per pubblicazione)
# Chains: build:components-css → ng build → build:schematics
npm run build:lib

# Build solo la libreria Angular (sviluppo)
ng build ng-core-ui

# Build solo gli schematics
npm run build:schematics

# Build con watch mode (sviluppo)
npm run watch

# Compile Tailwind CSS into styles/components.css (via Node script)
npm run build:components-css

# Run tests
npm test

# Run a specific test file
ng test --include='**/card.component.spec.ts'

# Test in CI (Chrome headless --no-sandbox)
npm run test:ci

# Lint
npm run lint
```

## Architecture

### Library Structure (`projects/ng-core-ui/src/lib/`)

```
system/         # Core bootstrap logic and state
  loading.service.ts      # LoadingService — contatore XHR con signal
  loading.interceptor.ts  # loadingInterceptor — auto show/hide su HTTP
  context-interceptor.ts  # contextInterceptor — inietta X-Context/X-AppId
  menu.guard.ts           # MenuGuard — verifica permessi da pathsSig
  ...
components/     # Reusable presentational UI components
  card.component/
  topbar.component/
  page-header.component/
  toast.component/        # ToastService + ToastComponent (core-toast)
  loading-overlay.component/  # LoadingOverlayComponent (core-loading-overlay)
  datatable.component/    # DatatableComponent + createPagedLoader (core-datatable)
  form-shell.component/   # FormShellComponent (core-form-shell) + FormModel + field components
    form-field.models.ts  # FormModel<T>, FormFieldDef, CoreFieldComponent, LookupResult
    form-shell.component.ts/html
    fields/               # TextInputField, TextareaField, ComboboxField, DatepickerField, LookupField
layout/         # Full-page layout wrappers
  app-switcher/ # AppSwitcherComponent (core-app-switcher) — pannello destra condiviso
  full-layout/  # FullLayoutComponent — sidenav sinistra + toolbar + app-switcher
  right-layout/ # RightLayoutComponent — toolbar + app-switcher (senza sidenav sinistra)
  simple-layout/# SimpleLayoutComponent — solo toolbar minimale
pages/          # ErrorPage (core-error-page, con "Riprova"), NotFoundPage, ForbiddenPage
system/labels.ts         # CoreLabels: dizionari it/en, LIB_LABELS, resolveLabels
system/labels.service.ts # CoreLabelsService.labels — testi correnti (environment.language)
system/tokens.ts         # LIB_TOKEN_URL, LIB_ENVIRONMENT_URL, LIB_BOOTSTRAP_TIMEOUT
system/build-info.ts     # BUILD_INFO (AppVersion/AppSha con fallback 'dev')
utils.ts        # AES-GCM decryption via Web Crypto API
main.ts         # provideGPAUICore() provider function
```

### Bootstrap Flow

Consuming apps call `provideGPAUICore(options?)` in their root config, where `options` is an optional `GpaCoreOptions` object with:
- `tokenUrl?: string` — overrides the default `/api/token`
- `environmentUrl?: string` — overrides the default `/environment/environment.json`
- `trustedOrigins?: string[]` — extra origins (besides the page origin) that receive `X-Context`/`X-AppId` and trigger the SSO reload on status 0 (token `LIB_TRUSTED_ORIGINS`)
- `bootstrapTimeoutMs?: number` — timeout of each bootstrap call (environment, token). Default `30000` (token `LIB_BOOTSTRAP_TIMEOUT`)
- `labels?: CoreLabelsOverrides` — per-language overrides of the library texts, e.g. `{ it: { datatable: { empty: 'Nessuna pratica' } } }` (token `LIB_LABELS`)

These set `LIB_TOKEN_URL` and `LIB_ENVIRONMENT_URL` injection tokens (in `system/tokens.ts`, re-exported by `main.ts`) used by `SystemService`.

Bootstrap is **owned by `SystemService`** and is started by `provideGPAUICore()` through a non-blocking `provideEnvironmentInitializer` (the app renders immediately and the layouts show the spinner). The constructor no longer starts it: injecting `SystemService` without `provideGPAUICore()` (e.g. in tests) makes no HTTP call. Layout components do **not** call `bootstrap()`; the guard `await`s it (and starts it if needed) to block navigation until completion.

The sequence inside `bootstrap()`:
1. `loadEnvironment()` — fetches `environmentUrl`, populates `environment`.
2. `loadToken()` — reads `appId` from `environment()`, fetches token with `AppId` header. If `env.encryptToken` is true, decrypts via AES-GCM. Populates `whoami`, `paths`, `apps` and the private `contexts` (read with `getContextByType(type)` / `getContext(type, id)`).
3. `menuTree` is a `computed` derived from `paths` — no explicit `.set()` needed.
4. Deduplication via `bootstrapPromise` field — concurrent `await`s reuse the same promise. On failure (HTTP error or timeout) `layoutState` becomes `'error'` and the rejected promise is **kept cached** (no auto-retry); the error page's "Riprova" reloads the page at the same URL.

**`encryptToken` is obfuscation, not encryption**: the AES-GCM key is `SHA-256(appId)` and `appId` is public in `environment.json`. It hides the token from casual inspection only; it does not protect it from anyone who can read the page.

Two `effect()`s run in the constructor:
- **Theme effect** — calls `StyleManagerService.setTheme(env.theme)` whenever `environment()` changes (guarded by `if (!env) return`).
- **Title effect** — reacts to `layoutState()`: sets `labels.browserTitle.loading` / `.error` (it: `'Caricamento...'` / `'Errore'`) and `environment()?.appTitle` when ready.

### Testi e lingua

Tutti i testi della libreria vengono da `CoreLabelsService.labels()` (dizionari `CORE_LABELS_IT` / `CORE_LABELS_EN` in `system/labels.ts`), scelti da `environment.language` (`it-IT` → `it`; lingue senza dizionario → `it`). Override per lingua con `provideGPAUICore({ labels })`. Nei componenti: `protected readonly t = inject(CoreLabelsService).labels;` e nel template `{{ t().sezione.chiave }}`. **Non aggiungere stringhe fisse nei template**: aggiungere la chiave a `CoreLabels` e a entrambi i dizionari (un test verifica che abbiano le stesse chiavi). Anche `GpaPaginatorIntl` legge da qui.

### State Signals

All exposed as Angular signals on `SystemService` (no `Sig` suffix):

| Signal | Kind | Type | Description |
|--------|------|------|-------------|
| `whoami` | `signal` | `{ user, roles, capabilities } \| null` | Authenticated user info |
| `paths` | `signal` | `PathNode[] \| null` | All allowed route nodes |
| `menuTree` | `computed` | `PathNode[] \| null` | Filtered+sorted menu nodes (`menu: true`), derived from `paths` |
| `apps` | `signal` | `App[] \| null` | App switcher entries (sorted) |
| `environment` | `signal` | `Environment \| null` | Runtime environment config |
| `environmentProperties` | `computed` | `Record<string, unknown>` | Derived from `environment().properties` |
| `layoutState` | `computed` | `'loading' \| 'ready' \| 'error'` | Bootstrap lifecycle state |
| `allowedEndpoints` | `computed` | `Set<string>` | Normalized endpoints from `paths` |

Helper methods: `getEnvironmentProperty(key)`, `canDo(action)` (checks `capabilities`), `normalizePath(path)`.

### Environment Interface

```ts
interface Environment {
  appId: string;
  appTitle: string;             // shown in the browser tab via Title service
  appDescription: string;
  theme: string;
  logoutPath: string;
  logoUrl?: string;             // optional URL for app-switcher logo (HTTPS, CDN, relative path)
  encryptToken?: boolean;       // if true, token response is AES-GCM encrypted
  properties?: Record<string, unknown>; // arbitrary app-specific config
}
```

Note: `AppSha` and `AppVersion` are injected by the build (`--define`). The library reads them only through `system/build-info.ts` (`BUILD_INFO`, guarded by `typeof`): without `--define` (`ng serve`, tests) they fall back to `'dev'` instead of throwing a ReferenceError.

### Route Guards

`MenuGuard` implements `CanActivateChild`. It `await`s `system.bootstrap()` (the cached promise) to block navigation until bootstrap completes, then checks `layoutState()`:
- the wildcard child `**` is always allowed → unknown URLs show `NotFoundPage` (404), not `/forbidden`
- `'error'` → lets the navigation through: the layout shows the error page instead of the content and the requested URL stays in the address bar
- `'ready'` → checks `allowedEndpoints`; unauthorized → redirect `/forbidden`
- `/error`, `/forbidden`, `/not-found` are always allowed (loop prevention)

### Route Pattern in Consuming Apps

Route IDs follow the convention `cap:<appId>:ui:<page>`. Apps define routes using `CoreRoute[]` in `src/app/app.routes.config.ts`, then pass them through `toRoutes()` in `app.config.ts`:

```ts
// app.routes.config.ts
export const APP_ROUTES: CoreRoute[] = [
  { id: 'cap:my-app:ui:home', endpoint: '', name: 'Home', description: 'Home', icon: 'home', menu: true, order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
];

// app.config.ts
provideRouter(toRoutes(APP_ROUTES)),
provideGPAUICore(),
```

`toRoutes(routes, options?)` accetta un secondo parametro `CoreRoutesOptions`:
- `layout?: 'full' | 'right' | 'simple'` — default `'full'`
- `guard?: boolean` — default `true` (abilita `MenuGuard` come `canActivateChild`)

`toRoutesYaml(APP_ROUTES)` is called by the library's pre-built script to emit `dist/caps/ui/routes.yaml` for backend permission seeding. Consuming apps run it via `npm run generate-acl` (which calls `node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-acl.mjs`), added to their `package.json` by the `ng-add` schematic.

### Styling

- **Angular Material 3** with a custom color theme using MD3 `light-dark()` CSS variables. Known brand themes: `gpa`, `cobalt`, `forest` — each with its own `_<theme>-colors.scss` + `_<theme>-theme.scss` pair in `projects/ng-core-ui/styles/`. `StyleManagerService` toggles CSS classes on `<body>`.
- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`). Utilities use `important: '.ui'` so they apply only inside `.ui` elements. Tailwind config uses `darkMode: 'class'`.
- **mat-theme-bridge.css** — contains a `@theme {}` block that registers `--color-*` tokens (e.g., `--color-surface`, `--color-primary`) with Tailwind so it generates semantic utilities (`bg-surface`, `text-on-primary`, etc.). This block is **for Tailwind utility generation only** — it does NOT provide the actual CSS variable values at runtime.
- **`_color-bridge.scss` + mixin** — the actual runtime bridge. Contains a single `color-bridge.apply()` mixin that declares `--color-*: var(--mat-sys-*)` mappings. Included via `@include color-bridge.apply()` inside `.gpa {}`, `.cobalt {}` and `.forest {}` in the respective theme SCSS files. This ensures the `var()` references resolve correctly in all browsers including WebKit/Safari, where declaring them on `:root` fails because `--mat-sys-*` variables are not in scope at that level.
- **Pre-built Tailwind output** — `styles/components.css` is compiled from `styles/components.input.css` (which imports the full Tailwind framework + mat-theme-bridge + `@source "../src"`) via `npm run build:components-css`. This prevents consuming apps from re-processing base/theme layers. The `@source "../src"` directive is required so Tailwind v4 scans the library's component templates for utility class names.
- **Preflight globale (scelta voluta)** — `components.css` include il preflight Tailwind (`@layer base`: `* { margin:0; padding:0; border:0 solid; box-sizing:border-box }` ecc.) **non** scoped a `.ui`: si applica a tutta l'app consumatrice. Layout e componenti della lib contano su quel reset; un'app che importa `components.css` lo eredita.
- **`.ui` su `<body>`** — l'ng-add aggiunge `ui` alle classi del `<body>` (conservando quelle esistenti, es. `mat-typography`). Overlay e dialog (CDK) vivono fuori dai layout: i dialog della lib passano anche `panelClass: 'ui'`.
- **Per-app Tailwind file** — consuming apps use `src/tailwind-app.css` (utilities layer only + mat-theme-bridge import + `@custom-variant ui (.ui &)` + `@source "."`), generated by the `ng-add` schematic.
- Components use `ViewEncapsulation.None` for shared styles. Component-specific styles are expressed as Tailwind utility classes directly in the HTML template (no per-component CSS files).
- **Layout SCSS** — `_simple-layout.scss` has been deleted; all simple-layout styles are now Tailwind inline classes. `_full-layout.scss` retains only the rules that cannot be expressed in Tailwind: `.sidenav` width/transition, `.nav-item` MDC overrides, `.label` collapse animation, `mat-sidenav.extra-sidenav` Material overrides. `_layout-shared.scss` contains only `mat-toolbar.toolbar` with `@include mat.toolbar-overrides()`. `themes.scss` imports `full-layout` (covers both FullLayout and RightLayout styles). `_full-layout.scss` was previously `_main-layout.scss`.

### Layout Bootstrap State Machine

All layout components read `layoutState` directly from `SystemService` (no local copy, no `bootstrap()` call, no `bootstrapFailed` signal). Templates use `@switch (layoutState())`:

- `'loading'` → `<core-loading-overlay />` (shown while bootstrap is in progress)
- `'ready'` → full layout rendered (sidenav/toolbar/content)
- `'error'` → `<core-error-page />` (inline centered error page with `cloud_off` icon and a "Riprova" button that reloads the page)

`layoutState` and `_bootstrapFailed` live entirely in `SystemService`. No router navigation on failure — the error page is shown in-place.

The **app-switcher** (`AppSwitcherComponent`, selector `core-app-switcher`) è un componente condiviso tra `FullLayoutComponent` e `RightLayoutComponent`. Usa `mat-sidenav mode="over" position="end"` — Angular Material's native overlay sidenav. Il wrapper `<mat-sidenav>` resta nel layout padre; `<core-app-switcher (close)="closeExtraSidenav()" />` ne è il contenuto.

### Theme Logo (App-switcher)

The logo is driven by `logoUrl` in `environment.json` — no SCSS/asset embedding required.

- If `environment.logoUrl` is set, an `<img>` with circular style (96×96 px, `border-radius: 50%`, `object-fit: cover`) is shown in the app-switcher panel.
- If `logoUrl` is absent or `undefined`, no logo element renders.
- The logo link uses `href="/"` (not `routerLink`) so it navigates to the true site root, independent of the app's `baseHref`.

### Exported Assets (`ng-package.json`)

The library publishes these assets alongside the compiled JS:
- `styles/**/*.scss` — SCSS brand theme files (including `_color-bridge.scss` mixin)
- `styles/components.css` — pre-built Tailwind output
- `styles/mat-theme-bridge.css` — `@theme {}` block for Tailwind utility generation
- `tailwind.config.js` — shared Tailwind config for consuming apps
- `bin/generate-acl.mjs` — pre-built script for emitting `dist/caps/ui/routes.yaml` (cap_defs + cap_groups)
- `assets/**/*.woff2` — Roboto fonts (300/regular/500/600) and Material Icons

### UI Components Reference

| Componente | Selettore | Exported from |
|---|---|---|
| `FullLayoutComponent` | — (layout) | `layout/full-layout` |
| `RightLayoutComponent` | — (layout) | `layout/right-layout` |
| `SimpleLayoutComponent` | — (layout) | `layout/simple-layout` |
| `AppSwitcherComponent` | `core-app-switcher` | `layout/app-switcher` |
| `CardComponent` | `core-card` | `components/card.component` |
| `TopbarComponent` | `core-topbar` | `components/topbar.component` |
| `PageHeaderComponent` | `core-page-header` | `components/page-header.component` |
| `ToastComponent` | `core-toast` | `components/toast.component` |
| `LoadingOverlayComponent` | `core-loading-overlay` | `components/loading-overlay.component` |
| `DatatableComponent` | `core-datatable` | `components/datatable.component` |
| `FormShellComponent` | `core-form-shell` | `components/form-shell.component` |
| `AlertComponent` | `core-alert` | `components/alert.component` |
| `ConfirmComponent` | `core-confirm` | `components/confirm.component` |

**Services:**
- `ToastService` — `success/error/info/warning(message, duration?, isHtml?)`.
- **HTML nei messaggi** (`isHtml` di toast, `confirm()`, `alert()`) — sempre via `[innerHTML]` con la sanitizzazione standard di Angular (restano `<b>`, `<br>`, liste, link; spariscono script, handler `on*`, `style`). Mai `bypassSecurityTrustHtml`. Colori semantici fissi (verde/rosso/blu/giallo), indipendenti dal tema.
- `LoadingService` — `show()/hide()` con contatore. `isLoading: Signal<boolean>`.
- `loadingInterceptor` — `HttpInterceptorFn` che chiama `show/hide` automaticamente su ogni XHR.
- `contextInterceptor` — aggiunge `X-Context`/`X-AppId` **solo** a richieste same-origin o verso `trustedOrigins`.
- `redirectInterceptor` — su status 0 fa `location.reload()` solo per richieste same-origin/trusted, browser online e al massimo una volta ogni 10 s (marker `sessionStorage` `gpa-core:redirect-reload`); altrimenti propaga l'errore.
- `GpaDateAdapter` — DateAdapter registrato da `provideGPAUICore()` (sostituisce `provideNativeDateAdapter()`): parse nell'ordine del locale (`it` → gg/mm/aaaa), date alle 12:00 locali per evitare lo shift UTC. `toIsoDate(date)` → `'YYYY-MM-DD'` per il backend.
- `AlertService` — `alert(options: AlertOptions): Promise<void>`. Apre un `MatDialog` (role `alertdialog`) con `title?`, `message`, `isHtml?`, `closeLabel?`, `type?: 'info'|'success'|'warning'|'danger'`. Awaitable; si risolve alla chiusura (bottone, Esc, backdrop).
- `ConfirmService` — `confirm(options: ConfirmOptions): Promise<boolean>`. Apre un `MatDialog` con `title?`, `message`, `isHtml?`, `confirmLabel?`, `cancelLabel?`, `type?: 'default'|'danger'` (danger: bottone rosso e focus iniziale su Annulla). `true` se confermato, `false` per Annulla/Esc/backdrop. Più richieste si impilano, ognuna risolve la propria Promise. Funziona in ogni layout: **non** servono `<core-confirm>`/`<core-alert>` nei template (sono il contenuto dei dialog).

**DataTable API:**
- `DatatableColumn { key, label, width?, sortable?, format?, component? }` — `key` supporta notazione dot per oggetti annidati (es. `address.city`). `sortable?: boolean` abilita click sull'header per ordinamento. `format?: (row) => string` per valori calcolati da più campi (priorità su `key`). `component` è un `Type<any>` Angular opzionale per celle con layout custom (priorità massima).
- `DatatableSort` — `{ field: string; dir: 'asc' | 'desc' } | null`. Rappresenta il sort corrente, passato come terzo argomento al loader.
- `DatatableAction<T> { icon, tooltip?, onClick, visible?, disabled?, buttonClass? }` — bottone icona per riga. `onClick/visible/disabled` ricevono la riga come argomento. `visible` default `true`. `buttonClass?` classe CSS aggiuntiva sul bottone.
- `DatatableLoader<T>` — `(page: number, pageSize: number, sort?: DatatableSort) => Observable<{ items: T[], total: number }>`.
- `createPagedLoader<T>(http, url, params?, headers?)` — modalità **server-side**: ogni cambio pagina/sort chiama l'API. Convenzione GPA: response `T[]` + header `totalCount`. `params?: () => Record<string,string|number>` è una funzione rieseguita ad ogni load. `headers?: () => Record<string,string>` inietta header custom. Il sort viene passato come query param `sort=field:dir`.
- `createInMemoryLoader<T>(http, url, options?)` — modalità **client-side**: una singola chiamata HTTP scarica tutto, poi paginazione/sort/filtro avvengono in memoria. Il dataset viene cachato nel closure. Opzioni: `extraParams?`, `headers?: () => Record<string,string>`, `filter?: () => string` (segnale testo ricerca), `filterFn?: (row, text) => boolean` (default: ricerca su tutti i campi stringa). Il loader restituisce anche `invalidate()` per svuotare la cache e forzare un re-fetch. Supporta risposta `T[]` diretta o `{ body: T[] }` GPA.
- `DatatableComponent.refresh(resetPage?: boolean)` — ricarica i dati. `resetPage=true` torna a pagina 1.
- `DatatableComponent` inputs aggiuntivi: `pageSizeOptions: number[]` (default `[10,25,50]`), `initialPageSize: number` (default `10`), `rowBackground?: (row) => string | null` per colorare le righe, `rowKey?: (row) => unknown` (identità per la selezione: **obbligatorio di fatto** con loader server-side, dove ogni fetch crea oggetti nuovi), `emptyMessage` (default `'Nessun dato'`).
- Output: `selectionChange`, `loadError` (errore del loader; la tabella mostra comunque "Riprova"). Una pagina oltre la fine (es. dopo una cancellazione) torna all'ultima pagina esistente. Header ordinabili: `<button>` con `aria-sort`.
- **Colonne custom**: passare `component: MyCellComponent` su `DatatableColumn`. Il componente deve esporre `value = input<unknown>()` e `row = input<unknown>()`. Viene renderizzato via `NgComponentOutlet` con `inputs` — nessun template markup aggiuntivo nel consuming component.

**FormShell API:**
- `FormModel<T>(initialValue, schema, layout)` — classe che racchiude la signal form Angular (`@angular/forms/signals`) e il layout UI. `schema` è la funzione schema (`required`, `min`, `max`, `minLength`, `email`, `hidden`, `disabled`). `layout` è una **factory function** `(ft: FieldTree<T>) => FormFieldDef<T>[]`.
- `FormModel.model` — `WritableSignal<T>`, source of truth dei valori. Leggere con `formModel.model()` nel submit.
- `FormModel.ft` — `FieldTree<T>`, accesso tipizzato per singoli field in `computed()`: `formModel.ft.nome().value()`.
- `FormModel.invalid` — `Signal<boolean>`, delega a `ft().invalid()`.
- `FormModel.submit(action: () => unknown): Promise<boolean>` — usa `submit()` di `@angular/forms/signals` con `ignoreValidators: 'none'`: marca touched tutto l'albero, non parte se invalido **o con validatori async `pending`**, ignora i click mentre un'azione è in corso. `action` può essere async; se ritorna errori `{ kind, message, fieldTree? }` (o array) vengono applicati ai campi. Pattern canonico per i bottoni submit.
- `FormModel.submitting` — `Signal<boolean>`, true durante l'azione di `submit()`.
- `FormModel.markAllAsTouched()` — marca touched l'intero albero (annidati e array compresi).
- `FormModel.reset(value?: T)` — resetta stato touched/dirty, opzionalmente aggiorna il valore.
- `FormFieldDef<T> { field, label, component, span?, inputs? }` — solo layout UI. `field` è il riferimento diretto al `FieldTree` (es. `ft.nome`), NON una stringa. TypeScript cattura i typo a compile time.
- Validazione, hidden, disabled: **sempre nello schema** del `FormModel` usando `required(p.field)`, `hidden(p.field, logic)`, `disabled(p.field, logic)` da `@angular/forms/signals`.
- Shell inputs: `[model]="formModel"`, `[columns]="2"`, `[actions]="actions"`. **Nessun output** — tutto gestito via `actions`.
- `FormShellAction { icon?, label?, tooltip?, variant?: 'icon'|'text'|'filled', position?: 'inline'|'footer', onClick, visible?: () => boolean, disabled?: () => boolean }` — `variant` default: `'icon'` per le azioni inline, `'filled'` per quelle `position: 'footer'`; `position` default: `'inline'`. `color` (`ButtonColor`, default `'tertiary'`). `visible` e `disabled` sono funzioni (anche signal-based).
- **`formField()()` pattern nei field component**: `formField()` = chiama InputSignal → FieldTree; `formField()()` = chiama FieldTree → FieldState con `.value`, `.errors()`, `.touched()`, `.invalid()`.
- `[formField]="formField()"` nei template dei field — passare il FieldTree al directive Angular, NON l'InputSignal (`[formField]="formField"` è sbagliato).
- Field component built-in: `TextInputFieldComponent` (`type?`), `TextareaFieldComponent` (`rows?`), `ComboboxFieldComponent` (`options: KVOption[]`), `DatepickerFieldComponent`, `LookupFieldComponent` (`dialogConfig: { component, data?, width?, maxWidth? }`), `RadioButtonListFieldComponent` (`options: KVOption[], inline?: boolean`), `CheckboxListFieldComponent` (`options: KVOption[], inline?: boolean` — valore è un array).

**KV picker (dialog di selezione per `LookupFieldComponent`):**
- `kvSinglePicker(config, title?, opts?)` / `kvMultiPicker(...)` — caricano le opzioni da `GET /api/<coreContext>/properties/<lookupName>` (risposta `KVProperty[]`: `key`, `value`, `order`, `kind`). **`coreContext`** è una property di `environment.properties` (letta con `getEnvironmentProperty('coreContext')`); se manca, il segmento viene omesso (`/api/properties/<lookupName>`). `lookupName` viene codificato con `encodeURIComponent`.
- `kvSignalSinglePicker` / `kvSignalMultiPicker` — stesse UI su opzioni già in memoria (`options: Signal<KVOption[]>`).
- Config comune: `labelColumn?`, `valueColumn?` (se presente mostra anche la colonna chiave), `cancelLabel?`; i multi anche `confirmLabel?`, `initialIds?`. Il risultato è un `LookupResult` (`{ id, label }`; nei multi `id` è un array e `label` le descrizioni separate da virgola).
- `loadKVOptions(url, blank = true)` — `Signal<KVOption[]>` per combobox/radio/checkbox dallo stesso tipo di endpoint.

**Field file:**
- `FileInputFieldComponent` — `multiple?: boolean` (valore `File[]`, altrimenti `File | null`), `acceptedMimeTypes?: string[]`, `valuePlaceHolder?`, `showAsRequired?`.
- `mimeTypeValidator({ allowedTypes, message? })` — accetta MIME esatti, wildcard (`image/*`) ed estensioni (`.pdf`); con `file.type` vuoto decide l'estensione. `maxFileSizeValidator({ maxBytes, message? })`. Entrambi funzionano su valore singolo o `File[]`.

### Key Conventions

- **Standalone components only** — no NgModules.
- **OnPush change detection** on all components.
- **Angular signals** for reactive state (not Subject/BehaviorSubject). Per flussi RxJS dentro i componenti (es. `switchMap` per cancel XHR) si usa `Subject` + `takeUntilDestroyed(destroyRef)`.
- Component selectors use the `core-` prefix (e.g., `core-card`, `core-topbar`).
- Each component lives in its own subfolder named `<name>.component/`.
- Route IDs follow `cap:<appId>:ui:<page>` convention.
- **No per-component CSS files** — stili espressi come classi Tailwind direttamente nel template HTML.
- **`ViewEncapsulation.None`** su tutti i componenti — gli stili globali del tema sono in `themes.scss`.
- **Dopo ogni aggiunta di nuove classi Tailwind** nei template, eseguire `npm run build:components-css` per rigenerare `styles/components.css`.

### Public API

All exports go through `projects/ng-core-ui/src/public-api.ts`. When adding a new component or service, it must be exported there to be usable by consumers.

### ng-add Schematic

`ng add @gpa-gruppo-progetti-avanzati-srl/ng-core-ui` runs the following steps to fully configure a consuming app:

1. **alignDependencies** — aligns `@angular/*` and non-Angular peer deps using `ng-add.targetVersions` from the library's `package.json` (Angular 22.x, Material 22.x, Tailwind 4.x, TypeScript 6.x).
2. **setupTailwind** — creates `.postcssrc.json` with `@tailwindcss/postcss`.
3. **updateAngularJson** — sets `preserveSymlinks`, adds style entries (fonts.scss, tailwind-app.css, components.css, themes.scss), adds assets mapping, doubles build budgets (1MB/2MB initial, 8kB/16kB component), sets `baseHref` in production config.
4. **updateStylesScss** — adds `@use "tailwindcss"` and `@source` directive for ng-core-ui.
5. **createDeclarations** — creates `src/declarations.d.ts` with `AppSha`/`AppVersion` globals.
6. **updateAppConfig** — rewrites `src/app/app.config.ts` with `provideGPAUICore()`, `provideRouter(toRoutes(APP_ROUTES))`, `provideHttpClient()`.
7. **createRoutesConfig** — creates `src/app/app.routes.config.ts` with a starter home route using the `cap:<projectName>:ui:home` ID convention. Reads the project name from `angular.json`.
8. **createGenerateRoutesScript** — adds `"generate-acl"` and `"generate-page"` scripts to the app's `package.json`.
9. **createHomeComponent** — creates `src/app/pages/home/home.component.ts` and `.html`. The component injects `SystemService` and exposes: `menu` (filtered `menuTreeSig()` excluding root), `homeTitle`/`homeSubTitle` (read from `environment.properties`), and `navigate(path)`. The template renders a `core-page-header` + a `core-card` grid for each menu item.
10. **cleanAppHtml** — replaces `app.html` / `app.component.html` with just `<router-outlet />`.
11. **createFontsScss** — creates `src/fonts.scss` with Roboto and Material Icons `@font-face` declarations.
12. **createTailwindAppCss** — creates `src/tailwind-app.css` importing `tailwindcss/utilities` and `mat-theme-bridge.css`.
13. **configureFrontdoor** — (optional, only when `--frontdoor`) configures `deployUrl` for Opem Front Door deployment.

**Schema options:**

| Option | Default | Description |
|--------|---------|-------------|
| `project` | — | Target Angular project name |
| `frontdoor` | `false` | Enable Opem Front Door integration |
| `baseHref` | `__BASE_HREF__` | Base href for production build |
| `tokenUrl` | `/api/token` (no FD) or `/api/corectx/acl` (FD) | Token endpoint |
| `environmentUrl` | `/environment/environment.json` (no FD) or `/api/corectx/environment` (FD) | Environment endpoint |
| `deployUrl` | — | Custom deployUrl for Front Door static assets |

### generate-page Schematic

`ng generate @gpa-gruppo-progetti-avanzati-srl/ng-core-ui:page` (shortcut: `npm run generate-page`) creates a new page in a consuming app:

1. Reads the project name from `angular.json` to build the route ID.
2. Creates `src/app/pages/<name>/<name>.component.ts` (standalone, OnPush).
3. Creates `src/app/pages/<name>/<name>.component.html` with a minimal scaffold.
4. Appends the new `CoreRoute` entry to `src/app/app.routes.config.ts` before the closing `];`.

**Schema options (all prompted interactively if omitted):**

| Option | Required | Description |
|--------|----------|-------------|
| `name` | yes | Page name in kebab-case (e.g. `user-list`). Drives file names, selector, class name, route path. |
| `description` | yes | Human-readable label for the menu. |
| `icon` | no | Material icon name. Default: `chevron_right`. |
| `menu` | no | Show in sidebar menu. Default: `true`. |
| `order` | yes | Integer menu order. |

Generated route ID format: `cap:<projectName>:ui:<name>`.
