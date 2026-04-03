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
ng add ng-core-ui
```

Il comando chiede solo l'**AppId** dell'applicazione (stringa identificativa usata per il decrypt del token):

```
? Inserisci l'AppId dell'applicazione: my-app-id
```

Vengono configurati automaticamente:

| File | Cosa viene fatto |
|------|-----------------|
| `package.json` | Aggiunge `@angular/material`, `tailwindcss`, `@tailwindcss/postcss` |
| `tailwind.config.js` | Creato con prefix `ui:` e important `.ui` |
| `.postcssrc.json` | Creato con plugin Tailwind v4 |
| `angular.json` | Aggiunge `themes.scss` agli stili globali |
| `src/declarations.d.ts` | Crea le dichiarazioni TypeScript per `AppSha` e `AppVersion` (costanti build-time) |
| `src/app/app.config.ts` | Aggiunge `provideGPAUICore()`, `provideHttpClient()`, `provideAnimationsAsync()` |
| `src/app/app.routes.ts` | Configura `MainLayoutComponent`, `MenuGuard`, `/forbidden` e `**` |

### 3. Aggiungi le rotte dell'applicazione

Apri `src/app/app.routes.ts` e aggiungi le tue pagine nell'array `children`:

```typescript
children: [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  // altre rotte...
],
```

Le rotte `children` sono automaticamente protette da `MenuGuard`, che verifica i permessi ricevuti dal token.

### 4. Avvia l'applicazione

```bash
ng serve
```

---

## Configurazione avanzata

### URL personalizzati per token e ambiente

Per default la libreria chiama:
- `GET /api/token` — token cifrato con AppId
- `GET /environment/environment.json` — configurazione ambiente

Per sovrascrivere gli URL, passa le opzioni a `provideGPAUICore()` in `app.config.ts`:

```typescript
provideGPAUICore('my-app-id', AppSha, AppVersion, {
  tokenUrl: '/api/v2/token',
  environmentUrl: '/config/env.json',
})
```

### Temi

La libreria supporta due temi: `gpa` (default) e `poste`. Il tema viene applicato automaticamente in base al campo `theme` restituito dall'endpoint `/environment/environment.json`:

```json
{ "theme": "poste" }
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

La pubblicazione su npm avviene automaticamente via GitHub Actions al push di un tag che corrisponde alla versione in `package.json`:

```bash
# 1. Aggiorna la versione in projects/ng-core-ui/package.json
# 2. Committa e tagga
git tag 0.0.13
git push origin 0.0.13
```

Per buildare localmente:

```bash
npm run build:lib   # compila libreria + schematics → dist/ng-core-ui/
```
