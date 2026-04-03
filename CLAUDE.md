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

Consuming apps call `provideGPAUICore(AppId, AppSha, AppVersion)` in their root config. This sets injection tokens used by `SystemService` to:

1. `loadToken()` — fetches an encrypted token from `/api/token`, decrypts it with AES-GCM using the AppId as key, and parses the result into `PathNode[]` (allowed route permissions) and `App[]` (app switcher entries).
2. `loadEnvironment()` — fetches `/environment/environment.json` for runtime config.
3. Both are deduplicated via a `bootstrapping` flag to prevent race conditions.

State is exposed as Angular signals: `whoamiSig`, `pathsSig`, `menuTreeSig`, `appsSig`, `contextsSig`, `environmentSig`.

### Route Guards

`MenuGuard` implements `CanActivateChild`. It checks the current route against `pathsSig` (allowed endpoints from the token) and redirects to `/forbidden` for unauthorized routes.

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
