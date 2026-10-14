# ng-core-ui

Libreria UI condivisa per le applicazioni GPA. Fornisce layout, componenti, gestione token/ambiente, routing pre-configurati, temi Angular Material 3 e utility Tailwind CSS v4.

- **Pacchetto:** `@gpa-gruppo-progetti-avanzati-srl/ng-core-ui`
- **Versione:** 0.2.0
- **Angular:** 22.2 · **Material:** 22.2 · **Tailwind:** 4.3 · **TypeScript:** 6.0
- **Documentazione completa:** [github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki)

---

## Installazione rapida

```bash
ng new my-app --routing --style=scss
cd my-app
ng add @gpa-gruppo-progetti-avanzati-srl/ng-core-ui
```

Lo schematic configura automaticamente Angular Material, Tailwind, routing, layout, font e tutto il necessario.

> **Requisiti.** Le peer dependencies richiedono Angular `^22` (`@angular/core`, `common`, `forms`,
> `router`, `platform-browser`, `material`, `cdk`) e `rxjs ^7.8`. Un'app a un major precedente va
> aggiornata prima (`ng update @angular/core @angular/cli`), altrimenti `npm install` fallisce
> per le peer (oppure si installa con `--legacy-peer-deps` e si lascia allineare a `ng add`).
>
> **Stili.** `styles/components.css` include il preflight Tailwind (reset di margin, padding e bordi)
> **globale**, non limitato a `.ui`: è voluto, layout e componenti della libreria ci contano.

→ Guida completa: [Getting Started](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Getting-Started)

---

## Dichiarazione rotte

```typescript
// src/app/app.routes.config.ts
export const APP_ROUTES: CoreRoute[] = [
  {
    id: 'cap:my-app:ui:home',
    endpoint: '',
    name: 'Home',
    description: 'Home',
    icon: 'home',
    menu: true,
    order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
];
```

→ [Routing e permessi](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Routing)

---

## Layout disponibili

| Componente | Layout | Documentazione |
|-----------|--------|----------------|
| `FullLayoutComponent` | Sidenav sinistra + toolbar + app-switcher destra | [Layout Full](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Layout-Full) |
| `RightLayoutComponent` | Toolbar + app-switcher destra (senza sidenav) | [Layout Right](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Layout-Right) |
| `SimpleLayoutComponent` | Solo toolbar minimale | [Layout Simple](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Layout-Simple) |

Seleziona il layout in `toRoutes()`:

```typescript
// app.config.ts
provideRouter(toRoutes(APP_ROUTES))               // default: 'full'
provideRouter(toRoutes(APP_ROUTES, { layout: 'right' }))
provideRouter(toRoutes(APP_ROUTES, { layout: 'simple' }))
```

---

## Componenti disponibili

| Componente | Selettore | Documentazione |
|-----------|-----------|----------------|
| `CardComponent` | `core-card` | [Card](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Card) |
| `TopbarComponent` | `core-topbar` | [Topbar](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Topbar) |
| `PageHeaderComponent` | `core-page-header` | [Page Header](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Page-Header) |
| `ToastComponent` | `core-toast` | [Toast](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Toast) |
| `LoadingOverlayComponent` | `core-loading-overlay` | [Loading Overlay](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Loading) |
| `DatatableComponent` | `core-datatable` | [DataTable](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Datatable) |
| `ConfirmService` | — (MatDialog) | [Confirm](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Confirm) |
| `AlertService` | — (MatDialog) | [Alert](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Alert) |

> `core-toast` è già incluso in tutti e tre i layout. Confirm e alert si aprono da `ConfirmService.confirm()` / `AlertService.alert()` (MatDialog): non vanno messi nei template.
>
> Documentazione allineata alla versione 0.2.0 (il wiki riporta lo SHA del commit di riferimento).

---

## Claude Code Skills

Per lavorare su questa libreria con Claude Code è disponibile una skill dedicata che fornisce contesto su FormShell, DataTable, bootstrap, theming e schematics.

**Prerequisiti** (se non già installati):

```bash
npx skills add angular/skills
npx skills add smithery.ai
```

**Skill ng-core-ui:**

```bash
npx skills add GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-skills
```

La skill viene caricata automaticamente in ogni sessione Claude Code all'interno di questo workspace.

---

## Pubblicazione (maintainer)

```bash
# 1. Aggiorna la versione in projects/ng-core-ui/package.json
# 2. Committa e tagga
git tag 0.1.0
git push origin 0.1.0
```

La pubblicazione su npm avviene automaticamente via GitHub Actions al push del tag.

```bash
# Build locale
npm run build:lib
```

---

Sviluppato da [GPA — Gruppo Progetti Avanzati s.r.l.](https://www.gpagroup.it)
