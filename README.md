# ng-core-ui

Libreria UI condivisa per le applicazioni GPA. Fornisce layout, componenti, gestione token/ambiente, routing pre-configurati, temi Angular Material 3 e utility Tailwind CSS v4.

- **Pacchetto:** `@gpa-gruppo-progetti-avanzati-srl/ng-core-ui`
- **Versione:** 0.0.35
- **Angular:** 21.x · **Material:** 21.x · **Tailwind:** 4.x
- **Documentazione completa:** [github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki)

---

## Installazione rapida

```bash
ng new my-app --routing --style=scss
cd my-app
ng add @gpa-gruppo-progetti-avanzati-srl/ng-core-ui
```

Lo schematic configura automaticamente Angular Material, Tailwind, routing, layout, font e tutto il necessario.

→ Guida completa: [Getting Started](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Getting-Started)

---

## Dichiarazione rotte

```typescript
// src/app/app.routes.config.ts
export const APP_ROUTES: CoreRoute[] = [
  {
    id: 'cap:my-app:ui:home',
    path: '',
    description: 'Home',
    icon: 'home',
    ismenu: true,
    order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
];
```

→ [Routing e permessi](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Routing)

---

## Componenti disponibili

| Componente | Selettore | Documentazione |
|-----------|-----------|----------------|
| `MainLayoutComponent` | — | [Layout Main](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Layout-Main) |
| `SimpleLayoutComponent` | — | [Layout Simple](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Layout-Simple) |
| `CardComponent` | `core-card` | [Card](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Card) |
| `TopbarComponent` | `core-topbar` | [Topbar](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Topbar) |
| `PageHeaderComponent` | `core-page-header` | [Page Header](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Page-Header) |
| `ToastComponent` | `core-toast` | [Toast](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Toast) |
| `LoadingOverlayComponent` | `core-loading-overlay` | [Loading Overlay](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Loading) |
| `DatatableComponent` | `core-datatable` | [DataTable](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Datatable) |
| `ConfirmComponent` | `core-confirm` | [Confirm](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Confirm) |
| `AlertComponent` | `core-alert` | [Alert](https://github.com/GPA-Gruppo-Progetti-Avanzati-SRL/ng-core-ui/wiki/Component-Alert) |

> `core-toast`, `core-confirm` e `core-alert` sono già inclusi nel `MainLayoutComponent`.

---

## Pubblicazione (maintainer)

```bash
# 1. Aggiorna la versione in projects/ng-core-ui/package.json
# 2. Committa e tagga
git tag 0.0.29
git push origin 0.0.29
```

La pubblicazione su npm avviene automaticamente via GitHub Actions al push del tag.

```bash
# Build locale
npm run build:lib
```

---

Sviluppato da [GPA — Gruppo Progetti Avanzati s.r.l.](https://www.gpagroup.it)
