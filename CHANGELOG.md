# Changelog

## [0.0.49] — 2026-05-14

### Breaking Changes

- **`MainLayoutComponent` rinominato in `FullLayoutComponent`** — impatta solo chi importa la classe direttamente (raro, poiché viene usata tramite `toRoutes()`). Il selettore cambia da `app-main-layout` a `app-full-layout`. Chi usava esplicitamente `{ layout: 'main' }` in `toRoutes()` riceverà un errore TypeScript: sostituire con `'full'`. Chi chiama `toRoutes(APP_ROUTES)` senza parametri non è impattato — il default rimane il layout completo.

### Nuove funzionalità

- **`RightLayoutComponent`** — nuovo layout intermedio tra `FullLayoutComponent` e `SimpleLayoutComponent`: include toolbar e app-switcher destro ma non la sidenav di navigazione sinistra. Attivabile con `toRoutes(APP_ROUTES, { layout: 'right' })`.

- **`AppSwitcherComponent`** (`core-app-switcher`) — componente condiviso che incapsula il pannello app-switcher destro (logo, lista app, logout, versione). Usato internamente da `FullLayoutComponent` e `RightLayoutComponent`.

- **`FileInputFieldComponent`** (`core-file-input-field`) — nuovo field component per `FormShell` con supporto drag & drop, validazione MIME type e rendering signal-compliant. Esportato da `public-api`. Inputs: `label`, `showAsRequired`, `multiple`, `acceptedMimeTypes`, `valuePlaceHolder`.

- **`ToastService` — supporto testo HTML** — i metodi `success/error/info/warning` accettano un terzo parametro `isHtml: boolean` (default `false`). Quando `true`, il messaggio viene renderizzato come HTML tramite `DomSanitizer`.

  ```typescript
  toastService.error('<b>Errore:</b> il file è troppo grande', 5000, true);
  ```

- **`ToastService` — toast persistente** — passare `duration = -1` mantiene il toast aperto fino alla chiusura manuale da parte dell'utente.

  ```typescript
  toastService.warning('Connessione assente — riprova manualmente', -1);
  ```

### Miglioramenti

- **`toRoutes()`** — il tipo del parametro `layout` è ora `'full' | 'right' | 'simple'` (era `'main' | 'simple'`). Il default rimane il layout completo (ora `'full'`).

- **`TopbarComponent`** — corretti bottoni azione e altezza toolbar.

- **`CardComponent`** — supporto layout a 3 righe.

- **Temi** — fix colori di sfondo per i temi `gpa` e `forest`; fix datepicker e dropdown nel tema `forest`.

- **Schematic `generate-action`** — aggiunto schematic per generare e gestire entry `CoreAction` in `app.actions.config.ts`.

---

## [0.0.48] — precedente

Vedere git history.
