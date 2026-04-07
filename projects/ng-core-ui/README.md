# ng-core-ui

Libreria UI condivisa per le applicazioni GPA. Fornisce layout, componenti, gestione token/ambiente e routing pre-configurati.

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
| `package.json` | Aggiunge `@angular/material`, `tailwindcss`, `@tailwindcss/postcss` |
| `.postcssrc.json` | Creato con plugin Tailwind v4 |
| `angular.json` | Aggiunge `themes.scss` agli stili globali e mapping assets `ng-core-ui` |
| `src/styles.scss` | Aggiunge `@use "tailwindcss"` e `@source` per ng-core-ui |
| `src/declarations.d.ts` | Dichiara `AppSha` e `AppVersion` (costanti build-time via `--define`) |
| `src/app/app.config.ts` | Aggiunge `provideRouter(toRoutes(APP_ROUTES))`, `provideGPAUICore()`, `provideHttpClient()`, `provideAnimationsAsync()` |
| `src/app/app.routes.config.ts` | Crea la configurazione delle rotte (`CoreRoute[]`) |
| `scripts/generate-routes.ts` | Script bun per generare `routes.json` a build time |

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
  {
    id: 'anagrafica',
    path: 'anagrafica',
    description: 'Anagrafica',
    icon: 'people',
    ismenu: true,
    order: 2,
    loadComponent: () =>
      import('./pages/anagrafica/anagrafica.component').then(m => m.AnagraficaComponent),
  },
];
```

Le rotte vengono automaticamente avvolte in `MainLayoutComponent` con `MenuGuard`, che verifica i permessi ricevuti dal token. Le rotte `/forbidden` e `**` sono aggiunte automaticamente.

### 4. Dichiara le capability UI (opzionale)

Crea `src/app/app.actions.config.ts` con le azioni disponibili nell'applicazione:

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
// oppure
canDelete = this.system.canDo({ id: 'delete' });
```

Il metodo confronta l'id come `APPID-ACTIONID` (uppercase) contro le capability presenti nel token.

### 5. Configura `environment.json`

La libreria legge `appId` dal file di ambiente a runtime (`/environment/environment.json`):

```json
{
  "appId": "my-app",
  "theme": "gpa",
  "logoutPath": "/logout"
}
```

### 6. Genera `routes.json` a build time

Lo script `scripts/generate-routes.ts` produce un file JSON con rotte e capability da consegnare al backend:

```bash
bun scripts/generate-routes.ts
# → dist/caps/ui/routes.json
```

Output generato:

```json
[
  { "type": "ui", "id": "DASHBOARD", "path": "/dashboard", "ismenu": true, "order": 1 },
  { "type": "ui", "id": "ANAGRAFICA", "path": "/anagrafica", "ismenu": true, "order": 2 },
  { "type": "ui_action", "id": "CREATE", "description": "Crea" },
  { "type": "ui_action", "id": "EDIT",   "description": "Modifica" },
  { "type": "ui_action", "id": "DELETE", "description": "Elimina" }
]
```

### 7. Build con costanti build-time

```bash
ng build --configuration production \
  --define "AppVersion='1.2.3'" \
  --define "AppSha='$(git rev-parse --short HEAD)'"
```

### 8. Avvia l'applicazione

```bash
ng serve
```

---

## Configurazione avanzata

### URL personalizzati per token e ambiente

Per default la libreria chiama:
- `GET /api/token` — token cifrato con `appId`
- `GET /environment/environment.json` — configurazione ambiente

Per sovrascrivere gli URL, passa le opzioni a `provideGPAUICore()` in `app.config.ts`:

```typescript
provideGPAUICore({
  tokenUrl: '/api/v2/token',
  environmentUrl: '/config/env.json',
})
```

### Temi

La libreria supporta due temi: `gpa` (default) e `poste`. Il tema viene applicato automaticamente in base al campo `theme` in `environment.json`:

```json
{ "theme": "poste" }
```

### Layout alternativo

Per usare `SimpleLayoutComponent` (solo toolbar, senza sidenav):

```typescript
provideRouter(toRoutes(APP_ROUTES, { layout: 'simple' }))
```

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
git tag 0.0.14
git push origin 0.0.14
```

Per buildare localmente:

```bash
bun run build:lib   # compila libreria + schematics → dist/ng-core-ui/
```
