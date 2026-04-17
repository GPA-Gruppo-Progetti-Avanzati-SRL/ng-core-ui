# ng-core-ui

Libreria UI condivisa per le applicazioni GPA. Fornisce layout, componenti, gestione token/ambiente, routing pre-configurati, temi Angular Material 3 e utility Tailwind CSS v4.

- **Pacchetto:** `@gpa-gruppo-progetti-avanzati-srl/ng-core-ui`
- **Versione:** 0.0.29
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

| File / azione | Cosa viene fatto |
|---------------|-----------------|
| `package.json` | Allinea `@angular/material`, `tailwindcss`, `@tailwindcss/postcss` alle versioni target; aggiunge gli script `generate-routes` e `generate-page` |
| `.postcssrc.json` | Creato con plugin `@tailwindcss/postcss` |
| `angular.json` | Aggiunge stili (`fonts.scss`, `tailwind-app.css`, `components.css`, `themes.scss`), mapping assets, budget raddoppiati, `preserveSymlinks` |
| `src/tailwind-app.css` | Entry point Tailwind per l'app (utilities + `mat-theme-bridge.css` + `@custom-variant ui`) |
| `src/fonts.scss` | `@font-face` per Roboto e Material Icons |
| `src/styles.scss` | Aggiunge `@use "tailwindcss"` e `@source` per ng-core-ui |
| `src/declarations.d.ts` | Dichiara `AppSha` e `AppVersion` (costanti build-time) |
| `src/app/app.config.ts` | `provideRouter(toRoutes(APP_ROUTES))`, `provideGPAUICore()`, `provideHttpClient()` |
| `src/app/app.routes.config.ts` | Configurazione rotte (`CoreRoute[]`) con home route iniziale |
| `src/app/pages/home/` | Componente home di esempio |
| `src/app/app.html` | Sostituito con `<router-outlet />` |

### 3. Dichiara le rotte

Apri `src/app/app.routes.config.ts` e aggiungi le rotte dell'applicazione:

```typescript
import type { CoreRoute } from '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

export const APP_ROUTES: CoreRoute[] = [
  {
    id: 'cap:my-app:ui:home',
    path: '',
    description: 'Home',
    icon: 'home',
    ismenu: true,
    order: 0,
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
];
```

> **Convenzione ID:** `cap:<appId>:ui:<pageName>` — l'`appId` deve coincidere con quello in `environment.json`.

Le rotte vengono automaticamente avvolte in `MainLayoutComponent` con `MenuGuard`, che verifica i permessi ricevuti dal token. Le rotte `/forbidden` e `**` sono aggiunte automaticamente da `toRoutes()`.

### 4. Genera una nuova pagina

```bash
npm run generate-page
```

Lo schematic crea il componente, il template e aggiunge la `CoreRoute` in `app.routes.config.ts`.

Opzioni disponibili (tutte interattive se omesse):

| Opzione | Descrizione |
|---------|-------------|
| `--name` | Nome pagina in kebab-case (es. `user-list`) |
| `--description` | Etichetta nel menu |
| `--icon` | Nome icona Material (default: `chevron_right`) |
| `--ismenu` | Mostra nel menu laterale (default: `true`) |
| `--order` | Ordine nel menu (intero) |

### 5. Dichiara le capability UI (opzionale)

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

### 6. Configura `environment.json`

La libreria legge `appId` dal file di ambiente a runtime:

```json
{
  "appId": "my-app",
  "appDescription": "La mia applicazione",
  "theme": "gpa",
  "logoutPath": "/logout"
}
```

Campi opzionali:

| Campo | Descrizione |
|-------|-------------|
| `encryptToken` | Se `true` il token è cifrato con AES-GCM usando `appId` come chiave |
| `properties` | Mappa arbitraria di configurazione app-specific |

### 7. Genera `routes.json` a build time

```bash
npm run generate-routes
# → dist/caps/ui/routes.json
```

### 8. Build con costanti build-time

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

Default: `tokenUrl = /api/token`, `environmentUrl = /environment/environment.json`.

### Temi

La libreria supporta tre temi: `gpa`, `poste` e `bnl`. Il tema viene applicato automaticamente in base al campo `theme` in `environment.json`:

```json
{ "theme": "bnl" }
```

| Tema | Colore primario | Colore terziario |
|------|----------------|-----------------|
| `gpa` | `#274c77` (blu) | `#cae9ff` (celeste) |
| `poste` | `#1B44B5` (blu Poste) | `#EBDD49` (giallo) |
| `bnl` | `#06975e` (verde BNL) | `#aff452` (lime) |

`StyleManagerService` aggiunge la classe corrispondente su `<body>`. I temi definiscono i token Angular Material 3 (`--mat-sys-*`) e li espongono come variabili Tailwind (`--color-*`) tramite il mixin `color-bridge.apply()` incluso in ogni file tema SCSS.

> **Nota WebKit/Safari:** i mapping `--color-*: var(--mat-sys-*)` sono dichiarati dentro i selettori `.gpa`/`.poste`/`.bnl` (non su `:root`) perché WebKit risolve i `var()` nelle custom properties eagerly durante l'ereditarietà.

### Logo applicazione

Ogni tema espone la variabile `--layout-logo-url`. Il file logo va in `assets/themes/<theme>/logo-<theme>.<ext>` con nome **univoco** tra i temi (esbuild piattisce tutti gli asset in `media/`).

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

### Layout e navigazione

| Componente | Selettore | Descrizione |
|-----------|-----------|-------------|
| `MainLayoutComponent` | — | Shell completa: sidenav + toolbar + app-switcher |
| `SimpleLayoutComponent` | — | Shell minimale: solo toolbar |
| `CardComponent` | `core-card` | Card con icona, titolo, sottotitolo e bottone |
| `TopbarComponent` | `core-topbar` | Topbar di sezione con slot per azioni custom |
| `PageHeaderComponent` | `core-page-header` | Intestazione pagina con titolo e sottotitolo |
| `NotFoundComponent` | — | Pagina 404 |
| `ForbiddenComponent` | — | Pagina 403 |

### Toast (`core-toast`)

Componente standalone da inserire nel template dove serve. Comunica con `ToastService` iniettato ovunque nell'app.

```typescript
// nel component
readonly toast = inject(ToastService);

this.toast.success('Salvataggio completato');
this.toast.error('Operazione fallita', 6000);   // durata custom in ms
this.toast.info('Nessuna modifica rilevata');
this.toast.warning('Sessione in scadenza');
```

```html
<!-- nel template della pagina o del layout -->
<core-toast />
```

I colori sono semantici e fissi indipendentemente dal tema attivo (verde/rosso/blu/giallo).

### Loading overlay (`core-loading-overlay`)

Spinner che copre il container padre. Il container deve avere `position: relative`.

```html
<div class="relative">
  <core-loading-overlay />
  <!-- contenuto della sezione -->
</div>
```

`LoadingService` gestisce un contatore: più chiamate concorrenti a `show()` richiedono altrettante `hide()` prima che lo spinner scompaia.

```typescript
readonly loading = inject(LoadingService);

// controllo manuale
this.loading.show();
this.loading.hide();
```

Per attivarlo automaticamente su tutte le chiamate HTTP, aggiungere `loadingInterceptor` in `app.config.ts`:

```typescript
provideHttpClient(withInterceptors([contextInterceptor, loadingInterceptor]))
```

### DataTable (`core-datatable`)

Tabella generica con paginazione server-side, integrata con la convenzione API GPA:
- Request: `?page=N&pageSize=M` (1-based)
- Response body: `{ body: T[] }`
- Response header: `total-elements: <count>`

```typescript
// Definizione colonne
readonly columns: DatatableColumn[] = [
  { key: 'nome',    label: 'Nome' },
  { key: 'cognome', label: 'Cognome' },
  { key: 'eta',     label: 'Età', width: '80px' },
];

// Loader con helper integrato
readonly loader = createPagedLoader<Person>(
  inject(HttpClient),
  '/api/v1/persons',
);

// Con filtri dinamici (riletti ad ogni cambio pagina)
readonly loader = createPagedLoader<Person>(
  inject(HttpClient),
  '/api/v1/persons',
  () => ({ luogodiNascita: this.cittaSig() }),
);
```

```html
<core-datatable [columns]="columns" [load]="loader" />

<!-- Con ref per refresh manuale (es. dopo un salvataggio) -->
<core-datatable #table [columns]="columns" [load]="loader" />
```

```typescript
// Refresh manuale
@ViewChild('table') table!: DatatableComponent;
this.table.refresh();
```

Input disponibili:

| Input | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `columns` | `DatatableColumn[]` | — | Definizione colonne (obbligatorio) |
| `load` | `DatatableLoader` | — | Funzione di caricamento (obbligatorio) |
| `pageSizeOptions` | `number[]` | `[10, 25, 50]` | Opzioni per il selettore pageSize |
| `initialPageSize` | `number` | `10` | Dimensione pagina iniziale |

---

## Pubblicazione (maintainer)

La pubblicazione su npm avviene automaticamente via GitHub Actions (trusted OIDC publishing) al push di un tag che corrisponde alla versione in `package.json`:

```bash
# 1. Aggiorna la versione in projects/ng-core-ui/package.json
# 2. Committa e tagga
git tag 0.0.29
git push origin 0.0.29
```

Per buildare localmente:

```bash
npm run build:lib   # CSS + libreria Angular + schematics → dist/ng-core-ui/
```
