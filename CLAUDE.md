# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 21 monorepo containing **ng-core-ui**, a reusable UI component library for GPA (Gruppo Progetti Avanzati) internal applications. It is published via ng-packagr and consumed by other Angular apps.

## Commands

```bash
# Build library + schematics (per pubblicazione)
npm run build:lib

# Build solo la libreria Angular (sviluppo)
ng build ng-core-ui

# Build solo gli schematics
npm run build:schematics

# Build con watch mode (sviluppo)
npm run watch

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
| `contextsSig` | `Context[] \| null` | Available contexts |
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

- **Angular Material 3** with a custom color theme in `.theme.css` using MD3 `light-dark()` CSS variables.
- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`). All utilities are prefixed with `ui:` (e.g., `ui:flex`, `ui:p-4`). The important selector is `.ui`.
- **SCSS theme files** in `projects/ng-core-ui/styles/` support two brand themes: `gpa` and `poste`. `StyleManagerService` applies themes by toggling CSS classes on `<body>`.
- Components use `ViewEncapsulation.None` for shared styles.

### Key Conventions

- **Standalone components only** — no NgModules.
- **OnPush change detection** on all components.
- **Angular signals** for reactive state (not Subject/BehaviorSubject).
- Component selectors use the `core-` prefix (e.g., `core-card`, `core-topbar`).
- Each component lives in its own subfolder named `<name>.component/`.

### Public API

All exports go through `projects/ng-core-ui/src/public-api.ts`. When adding a new component or service, it must be exported there to be usable by consumers.

### ng-add Schematic

`ng add @gpa-gruppo-progetti-avanzati-srl/ng-core-ui` runs 10 steps to fully configure a consuming app:

1. **alignDependencies** — aligns `@angular/*` and non-Angular peer deps using `ng-add.targetVersions` from the library's `package.json`.
2. **setupTailwind** — creates `.postcssrc.json` with `@tailwindcss/postcss`.
3. **updateAngularJson** — sets `preserveSymlinks`, adds theme SCSS, assets mapping, doubles build budgets, sets `baseHref` in production config.
4. **updateStylesScss** — adds `@use "tailwindcss"` and `@source` directive for ng-core-ui.
5. **createDeclarations** — creates `src/declarations.d.ts` with `AppSha`/`AppVersion` globals.
6. **updateAppConfig** — rewrites `src/app/app.config.ts` with `provideGPAUICore()`, `provideRouter(toRoutes(APP_ROUTES))`, `provideHttpClient()`.
7. **createRoutesConfig** — creates `src/app/app.routes.config.ts` with a starter `APP_ROUTES: CoreRoute[]`.
8. **createGenerateRoutesScript** — creates `scripts/generate-routes.ts` for emitting `routes.json`.
9. **createHomeComponent** — creates `src/app/pages/home/home.component.ts` and `.html`.
10. **cleanAppHtml** — replaces `app.html` / `app.component.html` with just `<router-outlet />`.

Schema options: `project`, `baseHref` (default `__BASE_HREF__`), `tokenUrl`, `environmentUrl`.
