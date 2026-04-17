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

| Componente | Selettore | Descrizione |
|-----------|-----------|-------------|
| `MainLayoutComponent` | — | Shell completa: sidenav collassabile + toolbar + app-switcher |
| `SimpleLayoutComponent` | — | Shell minimale: solo toolbar |
| `CardComponent` | `core-card` | Card con icona, titolo, sottotitolo e bottone azione |
| `TopbarComponent` | `core-topbar` | Barra di sezione con titolo, descrizione e slot per bottoni |
| `PageHeaderComponent` | `core-page-header` | Intestazione pagina con titolo, sottotitolo e divisore |
| `ToastComponent` | `core-toast` | Notifiche toast in sovrapposizione (già nel layout) |
| `LoadingOverlayComponent` | `core-loading-overlay` | Spinner che copre il container padre |
| `DatatableComponent` | `core-datatable` | Tabella con paginazione server-side |
| `ConfirmComponent` | `core-confirm` | Dialog di conferma modale (già nel layout) |
| `AlertComponent` | `core-alert` | Dialog di avviso modale (già nel layout) |
| `NotFoundComponent` | — | Pagina 404 |
| `ForbiddenComponent` | — | Pagina 403 |

> `core-toast`, `core-confirm` e `core-alert` sono già inclusi in `MainLayoutComponent` — non è necessario aggiungerli manualmente nelle pagine.

---

### Card (`core-card`)

Card con icona Material, titolo, sottotitolo opzionale e bottone azione.

```html
<core-card
  title="Gestione utenti"
  subtitle="Visualizza e modifica gli utenti"
  icon="people"
  buttonLabel="Apri"
  (buttonClick)="navigaUtenti()"
/>
```

| Input / Output | Tipo | Default | Descrizione |
|----------------|------|---------|-------------|
| `title` | `string` | `''` | Titolo della card |
| `subtitle` | `string` | `''` | Sottotitolo (opzionale) |
| `icon` | `string` | `'info'` | Nome icona Material |
| `buttonLabel` | `string` | `'Procedi'` | Etichetta del bottone |
| `(buttonClick)` | `EventEmitter<void>` | — | Evento al click del bottone |

---

### Topbar (`core-topbar`)

Barra di intestazione di sezione con titolo, descrizione opzionale e slot a destra per bottoni/azioni custom via `ng-content`.

```html
<core-topbar title="Elenco ordini" description="Visualizza tutti gli ordini attivi">
  <button mat-icon-button (click)="refresh()" matTooltip="Aggiorna">
    <mat-icon>refresh</mat-icon>
  </button>
  <button mat-icon-button (click)="export()" matTooltip="Esporta">
    <mat-icon>download</mat-icon>
  </button>
</core-topbar>
```

| Input | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `title` | `string` | `''` | Titolo della sezione |
| `description` | `string` | `''` | Sottotitolo / descrizione |

Il contenuto proiettato (`ng-content`) viene posizionato a destra, allineato verticalmente.

---

### Page Header (`core-page-header`)

Intestazione di pagina con titolo, sottotitolo e divisore orizzontale. Da usare in cima al template di una pagina.

```html
<core-page-header
  title="Dettaglio ordine"
  subtitle="Visualizza e modifica i dati dell'ordine selezionato"
/>
```

| Input | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `title` | `string` | `''` | Titolo della pagina |
| `subtitle` | `string` | `''` | Sottotitolo descrittivo |

---

### Toast (`core-toast`)

Notifiche non bloccanti posizionate in alto a destra. Il componente è già incluso nel `MainLayoutComponent` — basta iniettare il servizio.

```typescript
readonly toast = inject(ToastService);

this.toast.success('Salvataggio completato');
this.toast.error('Operazione fallita', 6000);  // durata custom in ms
this.toast.info('Nessuna modifica rilevata');
this.toast.warning('Sessione in scadenza');
```

| Metodo | Durata default | Colore |
|--------|---------------|--------|
| `success(msg, duration?)` | 3000 ms | Verde |
| `error(msg, duration?)` | 5000 ms | Rosso |
| `info(msg, duration?)` | 3000 ms | Blu |
| `warning(msg, duration?)` | 4000 ms | Giallo |

I colori sono fissi e indipendenti dal tema. Se si usa `SimpleLayoutComponent` o un layout custom, aggiungere `<core-toast />` al template.

---

### Confirm (`core-confirm`)

Dialog modale di conferma. Restituisce una `Promise<boolean>`. Già incluso nel `MainLayoutComponent`.

```typescript
readonly confirm = inject(ConfirmService);

async elimina(id: string) {
  const ok = await this.confirm.confirm({
    title:        'Elimina record',
    message:      'Sei sicuro di voler eliminare questo elemento? L\'operazione è irreversibile.',
    confirmLabel: 'Elimina',
    cancelLabel:  'Annulla',
    type:         'danger',   // bottone conferma rosso
  });

  if (ok) {
    await this.service.delete(id);
    this.toast.success('Elemento eliminato');
  }
}
```

| Opzione | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `message` | `string` | — | Testo del messaggio (obbligatorio) |
| `title` | `string` | `'Conferma'` | Titolo del dialog |
| `confirmLabel` | `string` | `'Conferma'` | Etichetta bottone di conferma |
| `cancelLabel` | `string` | `'Annulla'` | Etichetta bottone di annullamento |
| `type` | `'default' \| 'danger'` | `'default'` | `'danger'` colora il bottone di conferma in rosso |

Se si usa `SimpleLayoutComponent` o un layout custom, aggiungere `<core-confirm />` al template.

---

### Alert (`core-alert`)

Dialog modale informativo con un solo bottone di chiusura. Già incluso nel `MainLayoutComponent`.

```typescript
readonly alert = inject(AlertService);

async mostraErrore() {
  await this.alert.alert({
    title:      'Errore di validazione',
    message:    'Il codice fiscale inserito non è valido.',
    type:       'danger',
    closeLabel: 'Ho capito',
  });
  // esecuzione riprende dopo la chiusura
}
```

| Opzione | Tipo | Default | Descrizione |
|---------|------|---------|-------------|
| `message` | `string` | — | Testo del messaggio (obbligatorio) |
| `title` | `string` | `'Avviso'` | Titolo del dialog |
| `type` | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | Colore dell'intestazione |
| `closeLabel` | `string` | `'Chiudi'` | Etichetta del bottone |

| Tipo | Colore intestazione |
|------|-------------------|
| `info` | Blu |
| `success` | Verde |
| `warning` | Giallo |
| `danger` | Rosso |

Se si usa `SimpleLayoutComponent` o un layout custom, aggiungere `<core-alert />` al template.

---

### Loading overlay (`core-loading-overlay`)

Spinner semitrasparente che copre il container padre. Il container deve avere `position: relative`.

```html
<div class="relative">
  <core-loading-overlay />
  <!-- contenuto della sezione -->
</div>
```

`LoadingService` usa un contatore: `show()` incrementa, `hide()` decrementa. Lo spinner appare finché il contatore è > 0.

```typescript
readonly loading = inject(LoadingService);

this.loading.show();
// ... operazione ...
this.loading.hide();

// oppure come signal read-only
if (this.loading.isLoading()) { ... }
```

Per attivarlo automaticamente su tutte le chiamate HTTP aggiungere `loadingInterceptor` in `app.config.ts`:

```typescript
provideHttpClient(withInterceptors([contextInterceptor, loadingInterceptor]))
```

### DataTable (`core-datatable`)

Tabella generica con paginazione server-side, integrata con la convenzione API GPA:
- Request: `?page=N&pageSize=M` (1-based)
- Response body: `{ body: T[] }`
- Response header: `total-elements: <count>`

La tabella mantiene sempre la stessa altezza indipendentemente dal numero di righe restituite.

#### Input disponibili

| Input | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `columns` | `DatatableColumn[]` | — | Definizione colonne (obbligatorio) |
| `load` | `DatatableLoader` | — | Funzione di caricamento (obbligatorio) |
| `actions` | `DatatableAction[]` | `[]` | Bottoni azione per riga |
| `pageSizeOptions` | `number[]` | `[10, 25, 50]` | Opzioni per il selettore pageSize |
| `initialPageSize` | `number` | `10` | Dimensione pagina iniziale |

#### Uso base

```typescript
readonly columns: DatatableColumn[] = [
  { key: 'nome',    label: 'Nome' },
  { key: 'cognome', label: 'Cognome' },
  { key: 'eta',     label: 'Età', width: '80px' },
];

readonly loader = createPagedLoader<Person>(inject(HttpClient), '/api/v1/persons');
```

```html
<core-datatable [columns]="columns" [load]="loader" />
```

#### Tipi di colonna

> Priorità di rendering: `component` > `format` > `key`

**1. Colonna semplice** — legge un campo diretto dell'oggetto riga:

```typescript
{ key: 'nome',    label: 'Nome' }
{ key: 'cognome', label: 'Cognome', width: '150px' }
```

**2. Colonna con notazione dot** — naviga oggetti annidati di qualsiasi profondità:

```typescript
{ key: 'indirizzo.citta',    label: 'Città' }
{ key: 'contratto.tipo.cod', label: 'Codice tipo' }
```

**3. Colonna calcolata (`format`)** — valore stringa derivato da più campi, senza componente Angular:

```typescript
{
  key: '_',   // ignorata quando è presente format
  label: 'Nome completo',
  format: (row: Person) => `${row.nome} ${row.cognome}`,
},
{
  key: '_',
  label: 'Età',
  format: (row: Person) => {
    const anni = new Date().getFullYear() - new Date(row.dataNascita).getFullYear();
    return `${anni} anni`;
  },
},
{
  key: 'importo',
  label: 'Importo',
  format: (row: Ordine) =>
    row.importo.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }),
},
```

**4. Colonna con componente custom (`component`)** — layout arbitrario: icone, badge, chip, colori. Definire un componente standalone con gli input `value` e `row`:

```typescript
// stato-badge.component.ts
@Component({
  standalone: true,
  template: `
    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
      [class]="value() === 'attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
      {{ value() }}
    </span>
  `
})
export class StatoBadgeComponent {
  value = input<unknown>(); // valore del campo key
  row   = input<unknown>(); // intera riga (per logiche multi-campo)
}

// icona-bool.component.ts
@Component({
  standalone: true,
  imports: [MatIconModule],
  template: `
    <mat-icon [style.color]="value() ? 'green' : 'red'">
      {{ value() ? 'check_circle' : 'cancel' }}
    </mat-icon>
  `
})
export class IconaBoolComponent {
  value = input<unknown>();
  row   = input<unknown>();
}
```

```typescript
// home.component.ts
readonly columns: DatatableColumn[] = [
  { key: 'nome',    label: 'Nome' },
  { key: 'stato',   label: 'Stato',   component: StatoBadgeComponent },
  { key: 'premium', label: 'Premium', component: IconaBoolComponent },
];
```

```html
<!-- niente markup aggiuntivo nel template -->
<core-datatable [columns]="columns" [load]="loader" />
```

Il componente riceve sempre:
- `value` — il valore del campo `key` sulla riga corrente
- `row` — l'intera riga, per logiche che dipendono da più campi

#### Bottoni azione per riga

```typescript
readonly actions: DatatableAction<Person>[] = [
  {
    icon: 'edit',
    tooltip: 'Modifica',
    onClick: (row) => this.edit(row),
  },
  {
    icon: 'delete',
    tooltip: 'Elimina',
    onClick:  (row) => this.delete(row),
    hidden:   (row) => !row.canDelete,
    disabled: (row) => row.locked,
  },
];
```

```html
<core-datatable [columns]="columns" [load]="loader" [actions]="actions" />
```

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `icon` | `string` | Nome icona Material |
| `tooltip` | `string?` | Testo tooltip al hover |
| `onClick` | `(row) => void` | Handler al click |
| `hidden` | `(row) => boolean?` | Nasconde il bottone per la riga |
| `disabled` | `(row) => boolean?` | Disabilita il bottone per la riga |

#### Loader e filtri dinamici

```typescript
// Loader base
readonly loader = createPagedLoader<Person>(inject(HttpClient), '/api/v1/persons');

// Con filtri signal-based (riletti ad ogni cambio pagina)
readonly filtroSig = signal('');
readonly loader    = createPagedLoader<Person>(
  inject(HttpClient),
  '/api/v1/persons',
  () => ({ cognome: this.filtroSig(), stato: 'attivo' }),
);
```

#### Refresh manuale

```html
<core-datatable #table [columns]="columns" [load]="loader" />
```

```typescript
@ViewChild('table') table!: DatatableComponent;

afterSave() {
  this.table.refresh();
}
```

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
