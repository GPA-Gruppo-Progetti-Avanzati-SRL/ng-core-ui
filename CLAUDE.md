# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 21 monorepo containing **ng-core-ui** (v0.0.29), a reusable UI component library for GPA (Gruppo Progetti Avanzati) internal applications. It is published via ng-packagr and consumed by other Angular apps.

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

# Lint
ng lint
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
    form-field.models.ts  # FormModel<T>, FormFieldUIDef, CoreFieldComponent, LookupResult
    form-shell.component.ts/html
    fields/               # TextInputField, TextareaField, ComboboxField, DatepickerField, LookupField
layout/         # Full-page layout wrappers (main-layout, simple-layout)
  page-error/   # Inline error page shown when bootstrap fails (selector: page-error)
not-found/      # 404 page
forbidden/      # 403 page
utils.ts        # AES-GCM decryption via Web Crypto API
main.ts         # provideGPAUICore() provider function
```

### Bootstrap Flow

Consuming apps call `provideGPAUICore(options?)` in their root config, where `options` is an optional `GpaCoreOptions` object with:
- `tokenUrl?: string` — overrides the default `/api/token`
- `environmentUrl?: string` — overrides the default `/environment/environment.json`

These set `LIB_TOKEN_URL` and `LIB_ENVIRONMENT_URL` injection tokens used by `SystemService`.

Bootstrap is **sequential** via `SystemService.bootstrap()`:
1. `loadEnvironment()` — fetches `environmentUrl` (default `/environment/environment.json`) and parses it into an `Environment` object (`appId`, `theme`, `logoutPath`, `encryptToken?`, `properties?`). Sets `environmentSig`.
2. `loadToken()` — reads `appId` from `environmentSig()`, sends it as an `AppId` HTTP header to `tokenUrl`. If `env.encryptToken` is true, decrypts the response with AES-GCM using the `appId` as key; otherwise parses it directly. Sets `whoamiSig`, `pathsSig`, `menuTreeSig`, `appsSig`, `contextsSig`.
3. Deduplication is via a `bootstrapPromise` field — concurrent calls reuse the same `Promise<void>`. On failure the rejected promise is **kept cached** (not reset), so subsequent callers receive the same rejection without triggering a new attempt. This prevents the layout + `MenuGuard` from each spawning independent retries.

An `effect()` in the `SystemService` constructor automatically calls `StyleManagerService.setTheme()` whenever `environmentSig().theme` changes.

### State Signals

All exposed as Angular signals on `SystemService`:

| Signal | Type | Description |
|--------|------|-------------|
| `whoamiSig` | `{ user, roles, capabilities } \| null` | Authenticated user info |
| `pathsSig` | `PathNode[] \| null` | All allowed route nodes |
| `menuTreeSig` | `PathNode[] \| null` | Filtered+sorted menu nodes (`menu: true`) |
| `appsSig` | `App[] \| null` | App switcher entries (sorted) |
| `sitesSig` | `Site[] \| null` | Available sites |
| `environmentSig` | `Environment \| null` | Runtime environment config |
| `environmentProperties` | `Record<string, unknown>` | Computed from `environmentSig().properties` |

Helper methods: `getEnvironmentProperty(key)`, `canDo(action)` (checks `capabilities`), `normalizePath(path)`.

### Environment Interface

```ts
interface Environment {
  appId: string;
  appDescription: string;
  theme: string;
  logoutPath: string;
  logoUrl?: string;             // optional URL for app-switcher logo (HTTPS, CDN, relative path)
  encryptToken?: boolean;       // if true, token response is AES-GCM encrypted
  properties?: Record<string, unknown>; // arbitrary app-specific config
}
```

Note: `AppSha` and `AppVersion` are expected to be available globally (e.g., defined via build system) and are not part of the provider or environment interface.

### Route Guards

`MenuGuard` implements `CanActivateChild`. It checks the current route against `pathsSig` (allowed endpoints from the token) and redirects to `/forbidden` for unauthorized routes.

### Route Pattern in Consuming Apps

Route IDs follow the convention `cap:<appId>:ui:<page>`. Apps define routes using `CoreRoute[]` in `src/app/app.routes.config.ts`, then pass them through `toRoutes()` in `app.config.ts`:

```ts
// app.routes.config.ts
export const APP_ROUTES: CoreRoute[] = [
  { id: 'cap:my-app:ui:home', path: '', description: 'Home', icon: 'home', menu: true, order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
];

// app.config.ts
provideRouter(toRoutes(APP_ROUTES)),
provideGPAUICore(),
```

`toRoutesJson(APP_ROUTES)` is called by the library's pre-built script to emit `dist/caps/ui/routes.json` for backend permission seeding. Consuming apps run it via `npm run generate-routes` (which calls `node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-routes.mjs`), added to their `package.json` by the `ng-add` schematic.

### Styling

- **Angular Material 3** with a custom color theme using MD3 `light-dark()` CSS variables. Known brand themes: `gpa`, `cobalt`, `forest` — each with its own `_<theme>-colors.scss` + `_<theme>-theme.scss` pair in `projects/ng-core-ui/styles/`. `StyleManagerService` toggles CSS classes on `<body>`.
- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`). Utilities use `important: '.ui'` so they apply only inside `.ui` elements. Tailwind config uses `darkMode: 'class'`.
- **mat-theme-bridge.css** — contains a `@theme {}` block that registers `--color-*` tokens (e.g., `--color-surface`, `--color-primary`) with Tailwind so it generates semantic utilities (`bg-surface`, `text-on-primary`, etc.). This block is **for Tailwind utility generation only** — it does NOT provide the actual CSS variable values at runtime.
- **`_color-bridge.scss` + mixin** — the actual runtime bridge. Contains a single `color-bridge.apply()` mixin that declares `--color-*: var(--mat-sys-*)` mappings. Included via `@include color-bridge.apply()` inside `.gpa {}`, `.cobalt {}` and `.forest {}` in the respective theme SCSS files. This ensures the `var()` references resolve correctly in all browsers including WebKit/Safari, where declaring them on `:root` fails because `--mat-sys-*` variables are not in scope at that level.
- **Pre-built Tailwind output** — `styles/components.css` is compiled from `styles/components.input.css` (which imports the full Tailwind framework + mat-theme-bridge + `@source "../src"`) via `npm run build:components-css`. This prevents consuming apps from re-processing base/theme layers. The `@source "../src"` directive is required so Tailwind v4 scans the library's component templates for utility class names.
- **Per-app Tailwind file** — consuming apps use `src/tailwind-app.css` (utilities layer only + mat-theme-bridge import + `@custom-variant ui (.ui &)` + `@source "."`), generated by the `ng-add` schematic.
- Components use `ViewEncapsulation.None` for shared styles. Component-specific styles are expressed as Tailwind utility classes directly in the HTML template (no per-component CSS files).
- **Layout SCSS** — `_simple-layout.scss` has been deleted; all simple-layout styles are now Tailwind inline classes. `_main-layout.scss` retains only the rules that cannot be expressed in Tailwind: `.sidenav` width/transition, `.nav-item` MDC overrides, `.label` collapse animation, `mat-sidenav.extra-sidenav` Material overrides. `_layout-shared.scss` contains only `mat-toolbar.toolbar` with `@include mat.toolbar-overrides()`. `themes.scss` no longer imports `simple-layout`.

### Layout Bootstrap State Machine

Both `MainLayoutComponent` and `SimpleLayoutComponent` expose a `readonly layoutState = computed<'loading' | 'ready' | 'error'>()` signal derived from two internal signals (`whoamiSig` + `bootstrapFailed`). Templates use `@switch (layoutState())`:

- `'loading'` → `<core-loading-overlay />` (shown while bootstrap is in progress)
- `'ready'` → full layout rendered (sidenav/toolbar/content)
- `'error'` → `<page-error />` (inline centered error page with `cloud_off` icon)

`bootstrapFailed` is a private `signal(false)` set in the constructor's `.catch()`. No router navigation is performed on failure — the error is shown in-place.

The **app-switcher** in `MainLayoutComponent` uses `mat-sidenav mode="over" position="end"` — Angular Material's native overlay sidenav — replacing the old custom fixed/animated panel.

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
- `bin/generate-routes.mjs` — pre-built script for emitting `dist/caps/ui/routes.json`
- `assets/**/*.woff2` — Roboto fonts (300/regular/500/600) and Material Icons

### UI Components Reference

| Componente | Selettore | Exported from |
|---|---|---|
| `MainLayoutComponent` | — (layout) | `layout/main-layout` |
| `SimpleLayoutComponent` | — (layout) | `layout/simple-layout` |
| `CardComponent` | `core-card` | `components/card.component` |
| `TopbarComponent` | `core-topbar` | `components/topbar.component` |
| `PageHeaderComponent` | `core-page-header` | `components/page-header.component` |
| `ToastComponent` | `core-toast` | `components/toast.component` |
| `LoadingOverlayComponent` | `core-loading-overlay` | `components/loading-overlay.component` |
| `DatatableComponent` | `core-datatable` | `components/datatable.component` |
| `FormShellComponent` | `core-form-shell` | `components/form-shell.component` |

**Services:**
- `ToastService` — `success/error/info/warning(message, duration?)`. Colori semantici fissi (verde/rosso/blu/giallo), indipendenti dal tema.
- `LoadingService` — `show()/hide()` con contatore. `isLoading: Signal<boolean>`.
- `loadingInterceptor` — `HttpInterceptorFn` che chiama `show/hide` automaticamente su ogni XHR.

**DataTable API:**
- `DatatableColumn { key, label, width?, sortable?, format?, component? }` — `key` supporta notazione dot per oggetti annidati (es. `address.city`). `sortable?: boolean` abilita click sull'header per ordinamento. `format?: (row) => string` per valori calcolati da più campi (priorità su `key`). `component` è un `Type<any>` Angular opzionale per celle con layout custom (priorità massima).
- `DatatableSort` — `{ field: string; dir: 'asc' | 'desc' } | null`. Rappresenta il sort corrente, passato come terzo argomento al loader.
- `DatatableAction<T> { icon, tooltip?, onClick, visible?, disabled? }` — bottone icona per riga. `onClick/visible/disabled` ricevono la riga come argomento. `visible` default `true`.
- `DatatableLoader<T>` — `(page: number, pageSize: number, sort?: DatatableSort) => Observable<{ items: T[], total: number }>`.
- `createPagedLoader<T>(http, url, extraParams?)` — modalità **server-side**: ogni cambio pagina/sort chiama l'API. Convenzione GPA: response `{ body: T[] }` + header `total-elements`. `extraParams` è una funzione rieseguita ad ogni load. Il sort viene passato come query param `sort=field:dir`.
- `createInMemoryLoader<T>(http, url, options?)` — modalità **client-side**: una singola chiamata HTTP scarica tutto, poi paginazione/sort/filtro avvengono in memoria. Il dataset viene cachato nel closure. Opzioni: `extraParams?`, `filter?: () => string` (segnale testo ricerca), `filterFn?: (row, text) => boolean` (default: ricerca su tutti i campi stringa). Il loader restituisce anche `invalidate()` per svuotare la cache e forzare un re-fetch. Supporta risposta `T[]` diretta o `{ body: T[] }` GPA.
- `DatatableComponent.refresh(resetPage?: boolean)` — ricarica i dati. `resetPage=true` torna a pagina 1.
- **Colonne custom**: passare `component: MyCellComponent` su `DatatableColumn`. Il componente deve esporre `value = input<unknown>()` e `row = input<unknown>()`. Viene renderizzato via `NgComponentOutlet` con `inputs` — nessun template markup aggiuntivo nel consuming component.

**FormShell API:**
- `FormModel<T>(initialValue, validators, layout)` — classe che racchiude la signal form Angular (`@angular/forms/signals`) e il layout UI. `validators` è la funzione schema (`required`, `min`, `max`, `minLength`, `email`, `hidden`, `disabled`). `layout` è `FormFieldUIDef[]`.
- `FormModel.model` — `WritableSignal<T>`, source of truth dei valori. Leggere con `formModel.model()` nel submit.
- `FormModel.ft` — `FieldTree<T>`, accesso tipizzato per singoli field in `computed()`: `formModel.ft.nome().value()`.
- `FormModel.invalid` — `Signal<boolean>`, delega a `ft().invalid()`.
- `FormModel.submit(action: () => void)` — chiama `markAllAsTouched()`, poi esegue `action()` solo se `invalid()` è `false`. Pattern canonico per i bottoni submit.
- `FormModel.markAllAsTouched()` — forza la visualizzazione di tutti gli errori.
- `FormModel.reset(value?: T)` — resetta stato touched/dirty, opzionalmente aggiorna il valore.
- `FormFieldUIDef { key, label, component, span?, inputs? }` — solo layout UI. Nessuna logica di validazione/hidden/disabled qui.
- Validazione, hidden, disabled: **sempre nello schema** del `FormModel` usando `required(p.field)`, `hidden(p.field, logic)`, `disabled(p.field, logic)` da `@angular/forms/signals`.
- Shell inputs: `[model]="formModel"`, `[columns]="2"`, `[actions]="actions"`. **Nessun output** — tutto gestito via `actions`.
- `FormShellAction { icon?, label?, tooltip?, variant?: 'icon'|'text'|'filled', position?: 'inline'|'footer', onClick, disabled? }` — `variant` default: `'icon'` se no label, `'text'` se label; `position` default: `'inline'`.
- **`formField()()` pattern nei field component**: `formField()` = chiama InputSignal → FieldTree; `formField()()` = chiama FieldTree → FieldState con `.value`, `.errors()`, `.touched()`, `.invalid()`.
- `[formField]="formField()"` nei template dei field — passare il FieldTree al directive Angular, NON l'InputSignal (`[formField]="formField"` è sbagliato).
- Field component built-in: `TextInputFieldComponent` (`type?`), `TextareaFieldComponent` (`rows?`), `ComboboxFieldComponent` (`options: ComboboxOption[]`), `DatepickerFieldComponent`, `LookupFieldComponent` (`dialogConfig: { component, data?, width?, maxWidth? }`).

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

1. **alignDependencies** — aligns `@angular/*` and non-Angular peer deps using `ng-add.targetVersions` from the library's `package.json` (Angular 21.x, Material 21.x, Tailwind 4.x, TypeScript ~5.9).
2. **setupTailwind** — creates `.postcssrc.json` with `@tailwindcss/postcss`.
3. **updateAngularJson** — sets `preserveSymlinks`, adds style entries (fonts.scss, tailwind-app.css, components.css, themes.scss), adds assets mapping, doubles build budgets (1MB/2MB initial, 8kB/16kB component), sets `baseHref` in production config.
4. **updateStylesScss** — adds `@use "tailwindcss"` and `@source` directive for ng-core-ui.
5. **createDeclarations** — creates `src/declarations.d.ts` with `AppSha`/`AppVersion` globals.
6. **updateAppConfig** — rewrites `src/app/app.config.ts` with `provideGPAUICore()`, `provideRouter(toRoutes(APP_ROUTES))`, `provideHttpClient()`.
7. **createRoutesConfig** — creates `src/app/app.routes.config.ts` with a starter home route using the `cap:<projectName>:ui:home` ID convention. Reads the project name from `angular.json`.
8. **createGenerateRoutesScript** — adds `"generate-routes"` and `"generate-page"` scripts to the app's `package.json`.
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
| `tokenUrl` | `/api/token` (no FD) or `/api/core/acl` (FD) | Token endpoint |
| `environmentUrl` | `/environment/environment.json` (no FD) or `/api/core/environment` (FD) | Environment endpoint |
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
