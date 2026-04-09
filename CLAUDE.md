# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 21 monorepo containing **ng-core-ui** (v0.0.23), a reusable UI component library for GPA (Gruppo Progetti Avanzati) internal applications. It is published via ng-packagr and consumed by other Angular apps.

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
components/     # Reusable presentational UI components
layout/         # Full-page layout wrappers (main-layout, simple-layout)
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
3. Deduplication is via a `bootstrapPromise` field (a cached `Promise<void>`) — concurrent calls reuse the same promise.

An `effect()` in the `SystemService` constructor automatically calls `StyleManagerService.setTheme()` whenever `environmentSig().theme` changes.

### State Signals

All exposed as Angular signals on `SystemService`:

| Signal | Type | Description |
|--------|------|-------------|
| `whoamiSig` | `{ user, roles, capabilities } \| null` | Authenticated user info |
| `pathsSig` | `PathNode[] \| null` | All allowed route nodes |
| `menuTreeSig` | `PathNode[] \| null` | Filtered+sorted menu nodes (`ismenu: true`) |
| `appsSig` | `App[] \| null` | App switcher entries (sorted) |
| `sitesSig` | `Site[] \| null` | Available sites |
| `environmentSig` | `Environment \| null` | Runtime environment config |
| `environmentProperties` | `Record<string, unknown>` | Computed from `environmentSig().properties` |

Helper methods: `getEnvironmentProperty(key)`, `canDo(action)` (checks `capabilities`), `normalizePath(path)`.

### Environment Interface

```ts
interface Environment {
  appId: string;
  theme: string;
  logoutPath: string;
  encryptToken?: boolean;       // if true, token response is AES-GCM encrypted
  properties?: Record<string, unknown>; // arbitrary app-specific config
}
```

Note: `AppSha` and `AppVersion` are expected to be available globally (e.g., defined via build system) and are not part of the provider or environment interface.

### Route Guards

`MenuGuard` implements `CanActivateChild`. It checks the current route against `pathsSig` (allowed endpoints from the token) and redirects to `/forbidden` for unauthorized routes.

### Route Pattern in Consuming Apps

Apps define routes using `CoreRoute[]` in `src/app/app.routes.config.ts`, then pass them through `toRoutes()` in `app.config.ts`:

```ts
// app.routes.config.ts
export const APP_ROUTES: CoreRoute[] = [
  { id: 'home', path: '', description: 'Home', icon: 'home', ismenu: true, order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
];

// app.config.ts
provideRouter(toRoutes(APP_ROUTES)),
provideGPAUICore(),
```

`toRoutesJson(APP_ROUTES)` is used by `scripts/generate-routes.ts` to emit `dist/caps/ui/routes.json` for backend permission seeding.

### Styling

- **Angular Material 3** with a custom color theme using MD3 `light-dark()` CSS variables. Known brand themes: `gpa`, `poste` (applied via SCSS files in `projects/ng-core-ui/styles/`). `StyleManagerService` toggles CSS classes on `<body>`.
- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`). Utilities use `important: '.ui'` so they apply only inside `.ui` elements. Tailwind config uses `darkMode: 'class'`.
- **mat-theme-bridge.css** — contains a `@theme {}` block that registers `--color-*` tokens (e.g., `--color-surface`, `--color-primary`) with Tailwind so it generates semantic utilities (`bg-surface`, `text-on-primary`, etc.). This block is **for Tailwind utility generation only** — it does NOT provide the actual CSS variable values at runtime.
- **`_color-bridge.scss` + mixin** — the actual runtime bridge. Contains a single `color-bridge.apply()` mixin that declares `--color-*: var(--mat-sys-*)` mappings. Included via `@include color-bridge.apply()` inside `.gpa {}` and `.poste {}` in `_gpa-theme.scss` / `_poste-theme.scss`. This ensures the `var()` references resolve correctly in all browsers including WebKit/Safari, where declaring them on `:root` fails because `--mat-sys-*` variables are not in scope at that level.
- **Pre-built Tailwind output** — `styles/components.css` is compiled from `styles/components.input.css` (which imports the full Tailwind framework + mat-theme-bridge + `@source "../src"`) via `npm run build:components-css`. This prevents consuming apps from re-processing base/theme layers. The `@source "../src"` directive is required so Tailwind v4 scans the library's component templates for utility class names.
- **Per-app Tailwind file** — consuming apps use `src/tailwind-app.css` (utilities layer only + mat-theme-bridge import + `@custom-variant ui (.ui &)` + `@source "."`), generated by the `ng-add` schematic.
- Components use `ViewEncapsulation.None` for shared styles. Component-specific styles are expressed as Tailwind utility classes directly in the HTML template (no per-component CSS files).

### Exported Assets (`ng-package.json`)

The library publishes these assets alongside the compiled JS:
- `styles/**/*.scss` — SCSS brand theme files (including `_color-bridge.scss` mixin)
- `styles/components.css` — pre-built Tailwind output
- `styles/mat-theme-bridge.css` — `@theme {}` block for Tailwind utility generation
- `tailwind.config.js` — shared Tailwind config for consuming apps
- `assets/**/*.woff2` — Roboto fonts (300/regular/500/600) and Material Icons

### Key Conventions

- **Standalone components only** — no NgModules.
- **OnPush change detection** on all components.
- **Angular signals** for reactive state (not Subject/BehaviorSubject).
- Component selectors use the `core-` prefix (e.g., `core-card`, `core-topbar`).
- Each component lives in its own subfolder named `<name>.component/`.

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
7. **createRoutesConfig** — creates `src/app/app.routes.config.ts` with a starter `APP_ROUTES: CoreRoute[]`.
8. **createGenerateRoutesScript** — creates `scripts/generate-routes.ts` for emitting `routes.json`.
9. **createHomeComponent** — creates `src/app/pages/home/home.component.ts` and `.html`.
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
