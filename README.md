# ng-core-ui

Libreria UI condivisa per le applicazioni GPA. Fornisce layout, componenti, gestione token/ambiente, routing pre-configurati, temi Angular Material 3 e utility Tailwind CSS v4.

- **Pacchetto:** `@gpa-gruppo-progetti-avanzati-srl/ng-core-ui`
- **Versione:** 0.0.23
- **Angular:** 21.x · **Material:** 21.x · **Tailwind:** 4.x

---

## Creare una nuova applicazione da zero

### 1. Crea il progetto Angular

```bash
ng new my-app --routing --style=scss
cd my-app
```

### 2. Aggiungi la libreria

```bash
ng add @gpa-gruppo-progetti-avanzati-srl/ng-core-ui
```

Vengono configurati automaticamente:

| File | Cosa viene fatto |
|------|-----------------|
| `package.json` | Allinea `@angular/material`, `tailwindcss`, `@tailwindcss/postcss` alle versioni target |
| `.postcssrc.json` | Creato con plugin `@tailwindcss/postcss` |
| `angular.json` | Aggiunge stili (`fonts.scss`, `tailwind-app.css`, `components.css`, `themes.scss`), mapping assets, budget raddoppiati |
| `src/tailwind-app.css` | Entry point Tailwind per l'app (utilities + `@custom-variant ui`) |
| `src/fonts.scss` | `@font-face` per Roboto e Material Icons |
| `src/styles.scss` | Aggiunge `@use "tailwindcss"` e `@source` per ng-core-ui |
| `src/declarations.d.ts` | Dichiara `AppSha` e `AppVersion` (costanti build-time) |
| `src/app/app.config.ts` | `provideRouter(toRoutes(APP_ROUTES))`, `provideGPAUICore()`, `provideHttpClient()` |
| `src/app/app.routes.config.ts` | Configurazione rotte (`CoreRoute[]`) |
| `scripts/generate-routes.ts` | Script per generare `routes.json` a build time |

### 3. Dichiara le rotte

Apri `src/app/app.routes.config.ts` e aggiungi le rotte dell'applicazione:

```typescript
import type { CoreRoute } from '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

export const APP_ROUTES: CoreRoute[] = [
  {
    id: 'dashboard',
    path: 'dashboard',
    description: 'Dashboard',
    icon: 'dashboard',
    ismenu: true,
    order: 1,
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
];
```

Le rotte vengono automaticamente avvolte in `MainLayoutComponent` con `MenuGuard`, che verifica i permessi ricevuti dal token. Le rotte `/forbidden` e `**` sono aggiunte automaticamente.

### 4. Dichiara le capability UI (opzionale)

```typescript
import type { CoreAction } from '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

export const APP_ACTIONS: CoreAction[] = [
  { id: 'create', description: 'Crea' },
  { id: 'edit',   description: 'Modifica' },
  { id: 'delete', description: 'Elimina' },
];
```

Per verificare a runtime se l'utente può eseguire un'azione:

```typescript
system = inject(SystemService);

canCreate = this.system.canDo('create');
```

Il metodo confronta l'id come `APPID-ACTIONID` (uppercase) contro le capability presenti nel token.

### 5. Configura `environment.json`

La libreria legge `appId` dal file di ambiente a runtime:

```json
{
  "appId": "my-app",
  "theme": "gpa",
  "logoutPath": "/logout"
}
```

### 6. Genera `routes.json` a build time

```bash
npx ts-node scripts/generate-routes.ts
# → dist/caps/ui/routes.json
```

### 7. Build con costanti build-time

```bash
ng build --configuration production \
  --define "AppVersion='1.2.3'" \
  --define "AppSha='$(git rev-parse --short HEAD)'"
```

---

## Configurazione avanzata

### URL personalizzati per token e ambiente

```typescript
provideGPAUICore({
  tokenUrl: '/api/v2/token',
  environmentUrl: '/config/env.json',
})
```

### Temi

La libreria supporta due temi: `gpa` e `poste`. Il tema viene applicato automaticamente in base al campo `theme` in `environment.json`:

```json
{ "theme": "poste" }
```

`StyleManagerService` aggiunge la classe corrispondente su `<body>`. I temi definiscono i token Angular Material 3 (`--mat-sys-*`) e li espongono come variabili Tailwind (`--color-*`) tramite il mixin `color-bridge.apply()` incluso in ogni file tema SCSS.

> **Nota WebKit/Safari:** i mapping `--color-*: var(--mat-sys-*)` sono dichiarati dentro i selettori `.gpa`/`.poste` (non su `:root`) perché WebKit risolve i `var()` nelle custom properties eagerly durante l'ereditarietà.

### Layout alternativo

Per usare `SimpleLayoutComponent` (solo toolbar, senza sidenav):

```typescript
provideRouter(toRoutes(APP_ROUTES, { layout: 'simple' }))
```

### Integrazione Opem Front Door

```bash
ng add @gpa-gruppo-progetti-avanzati-srl/ng-core-ui --frontdoor
```

Configura automaticamente `deployUrl`, `tokenUrl` (`/api/core/acl`) e `environmentUrl` (`/api/core/environment`).

---

## Componenti disponibili

| Componente | Selettore | Descrizione |
|-----------|-----------|-------------|
| `MainLayoutComponent` | — | Shell completa: sidenav + toolbar + app-switcher |
| `SimpleLayoutComponent` | — | Shell minimale: solo toolbar |
| `CardComponent` | `core-card` | Card con icona, titolo, sottotitolo e bottone |
| `TopbarComponent` | `core-topbar` | Topbar con slot per azioni custom |
| `NotFoundComponent` | — | Pagina 404 |
| `ForbiddenComponent` | — | Pagina 403 |

### Esempio `core-card`

```html
<core-card
  title="Anagrafica"
  subtitle="Gestione clienti e fornitori"
  icon="people"
  buttonLabel="Apri"
  (buttonClick)="navigate()"
/>
```

---

## Pubblicazione (maintainer)

La pubblicazione su npm avviene automaticamente via GitHub Actions (trusted OIDC publishing) al push di un tag che corrisponde alla versione in `package.json`:

```bash
# 1. Aggiorna la versione in projects/ng-core-ui/package.json
# 2. Committa e tagga
git tag 0.0.23
git push origin 0.0.23
```

Per buildare localmente:

```bash
npm run build:lib   # CSS + libreria Angular + schematics → dist/ng-core-ui/
```
