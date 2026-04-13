# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-13T08:59:21.339Z
> Files: 89 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.editorconfig` — Editor configuration (~84 tok)
- `.gitignore` — Git ignore rules (~195 tok)
- `.theme.css` — Styles: 154 vars (~3885 tok)
- `angular.json` (~268 tok)
- `CLAUDE.md` — OpenWolf (~3176 tok)
- `LICENSE` — Project license (~291 tok)
- `package.json` — Node.js package manifest (~502 tok)
- `README.md` — Project documentation (~1762 tok)
- `tsconfig.json` — TypeScript configuration (~324 tok)

## .angular/cache/21.2.7/ng-packagr/

- `7ba54d5fadc01d61569517315f3833319cf46573d4f09d99cb47ef4d3aa09962` — \n * Pure TypeScript utilities for serializing route/action definitions to JSON.\n * No Angular dependencies — safe to import from Node.js / Bun bu... (~58374 tok)

## .angular/cache/21.2.7/ng-packagr/tsbuildinfo/

- `gpa-gruppo-progetti-avanzati-srl-ng-core-ui.tsbuildinfo` (~18437 tok)

## .claude/

- `settings.json` (~441 tok)
- `settings.local.json` — Declares v (~967 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .github/workflows/

- `publish.yml` — CI: Publish ng-core-ui to npm (~319 tok)

## projects/ng-core-ui/

- `.postcssrc.json` (~16 tok)
- `ng-package.json` — /*.scss", (~158 tok)
- `package.json` — Node.js package manifest (~388 tok)
- `README.md` — Project documentation (~1420 tok)
- `tailwind.config.js` — Tailwind CSS configuration (~59 tok)
- `tsconfig.lib.json` — /*.ts" (~147 tok)
- `tsconfig.lib.prod.json` (~115 tok)
- `tsconfig.spec.json` — /*.d.ts", (~127 tok)

## projects/ng-core-ui/bin/

- `generate-routes.mjs` — @gpa-gruppo-progetti-avanzati-srl/ng-core-ui — generate-routes (~434 tok)
- `generate-routes.ts` — Generate routes.json for backend permission seeding. (~370 tok)

## projects/ng-core-ui/schematics/

- `collection.json` (~145 tok)
- `migrations.json` (~97 tok)
- `package.json` — Node.js package manifest (~8 tok)
- `tsconfig.json` — TypeScript configuration (~122 tok)

## projects/ng-core-ui/schematics/generate-page/

- `index.ts` — 'user-list' → 'UserList' (~1020 tok)
- `schema.json` (~405 tok)
- `types.ts` — Exports Schema (~35 tok)

## projects/ng-core-ui/schematics/ng-add/

- `constants.ts` — Exports LIB, LIB_TARGET_VERSIONS (~160 tok)
- `index.ts` — Exports ngAdd (~516 tok)
- `schema.json` (~548 tok)
- `types.ts` — Exports Schema (~47 tok)

## projects/ng-core-ui/schematics/ng-add/steps/

- `align-dependencies.ts` — Exports alignDependencies (~980 tok)
- `clean-app-html.ts` — Exports cleanAppHtml (~159 tok)
- `configure-frontdoor.ts` — Exports FRONTDOOR_BASE_HREF, FRONTDOOR_TOKEN_URL, FRONTDOOR_ENVIRONMENT_URL, FRONTDOOR_DEPLOY_URL, configureFrontdoor (~500 tok)
- `create-declarations.ts` — Exports createDeclarations (~141 tok)
- `create-dockerfile.ts` — Exports createDockerfile (~608 tok)
- `create-fonts-scss.ts` — I path puntano a node_modules/ relativamente a src/fonts.scss (un livello su). (~554 tok)
- `create-generate-routes-script.ts` — Exports createGenerateRoutesScript (~336 tok)
- `create-home-component.ts` — Exports HomeComponent, createHomeComponent (~574 tok)
- `create-routes-config.ts` — Exports APP_ROUTES, createRoutesConfig (~468 tok)
- `create-tailwind-app-css.ts` — Path relativo a src/tailwind-app.css (~529 tok)
- `setup-tailwind.ts` — Exports setupTailwind (~114 tok)
- `update-angular-json.ts` — Exports updateAngularJson (~1092 tok)
- `update-app-config.ts` — API routes: DELETE (1 endpoints) (~845 tok)
- `update-styles-scss.ts` — Tailwind è ora gestito da src/tailwind-app.css (puro CSS → PostCSS, solo @utilities). (~517 tok)

## projects/ng-core-ui/schematics/ng-update/

- `index.ts` — Exports ngUpdate (~812 tok)

## projects/ng-core-ui/src/

- `declarations.d.ts` — Declares AppSha (~24 tok)
- `public-api.ts` — SYSTEM (~224 tok)

## projects/ng-core-ui/src/lib/

- `main.ts` — Exports LIB_TOKEN_URL, LIB_ENVIRONMENT_URL, GpaCoreOptions, provideGPAUICore (~276 tok)
- `utils.ts` — Decrypts a hex-encoded token using an AppID as the key. (~594 tok)

## projects/ng-core-ui/src/lib/components/card.component/

- `card.component.html` (~349 tok)
- `card.component.ts` — Exports CardComponent (~186 tok)

## projects/ng-core-ui/src/lib/components/topbar.component/

- `topbar.component.html` (~182 tok)
- `topbar.component.ts` — Exports TopbarComponent (~102 tok)

## projects/ng-core-ui/src/lib/forbidden/

- `forbidden.component.ts` — Exports ForbiddenComponent (~136 tok)

## projects/ng-core-ui/src/lib/layout/main-layout/

- `main-layout.component.html` (~950 tok)
- `main-layout.component.scss` — Styles: 57 rules, 4 vars (~3093 tok)
- `main-layout.component.ts` — Misura la larghezza naturale dell'aside (label visibili) senza causare flash visivi. (~1381 tok)

## projects/ng-core-ui/src/lib/layout/simple-layout/

- `simple-layout.component.html` (~191 tok)
- `simple-layout.component.scss` — Styles: 8 rules (~346 tok)
- `simple-layout.component.ts` — Exports SimpleLayoutComponent (~427 tok)

## projects/ng-core-ui/src/lib/not-found/

- `not-found.component.ts` — Exports NotFoundComponent (~132 tok)

## projects/ng-core-ui/src/lib/system/

- `context-interceptor.ts` — Exports contextInterceptor (~138 tok)
- `environment.ts` — Exports Environment (~52 tok)
- `menu.guard.ts` — Exports MenuGuard. Controlla sia URL reale che path template (:param) contro allowedEndpoints (~650 tok)
- `routes-json.ts` — Pure TypeScript utilities for serializing route/action definitions to JSON. (~392 tok)
- `routes.ts` — Exports CoreRoute, CoreRoutesOptions, toRoutes (~417 tok)
- `style-manager.service.ts` — Applies the specified theme class to the body and removes other known themes. (~281 tok)
- `system.models.ts` — Exports PathNode, App, Site, TokenResponse (~172 tok)
- `system.service.ts` — Exports SystemService (~1759 tok)

## projects/ng-core-ui/styles/

- `_color-bridge.scss` — / Maps Angular Material MD3 --mat-sys-* tokens to Tailwind --color-* tokens. (~687 tok)
- `_gpa-colors.scss` — This file was generated by running 'ng generate @angular/material:theme-color'. (~1379 tok)
- `_gpa-theme.scss` — Styles: 8 rules, 3 vars (~239 tok)
- `_logos.scss` — AUTO-GENERATED by scripts/embed-logos.mjs. SCSS vars $gpa (SVG URL-encoded) and $poste (PNG base64) for logo data URIs. (~60 tok)
- `_poste-colors.scss` — This file was generated by running 'ng generate @angular/material:theme-color'. (~1336 tok)
- `_poste-theme.scss` — Styles: 8 rules, 4 vars (~284 tok)
- `components.css` — Styles: 5 rules, 35 vars, 5 layers (~4230 tok)
- `components.input.css` — Styles: 4 rules (~31 tok)
- `mat-theme-bridge.css` — Bridges Angular Material MD3 CSS variables to Tailwind v4 color tokens. (~817 tok)
- `themes.scss` — Styles: 9 rules, 1 vars (~307 tok)

## scripts/

- `build-bin.mjs` — Bundles projects/ng-core-ui/bin/generate-routes.ts (~355 tok)
- `build-components-css.mjs` — Generates projects/ng-core-ui/styles/components.css (~243 tok)
- `decode-token.ts` — Decifra un token AES-GCM (hex) prodotto dall'endpoint /api/token (~961 tok)
- `embed-logos.mjs` — Generates projects/ng-core-ui/styles/_logos.scss (~485 tok)
