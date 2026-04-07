import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  SchematicsException,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

const LIB = '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

// Versioni target lette dal campo ng-add.targetVersions del package.json della libreria.
// Le peerDependencies dichiarano range larghi (>=19) per non bloccare npm install;
// i valori esatti da impostare nell'app consumatrice stanno qui.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LIB_TARGET_VERSIONS: Record<string, string> =
  (require('../../package.json') as { 'ng-add'?: { targetVersions?: Record<string, string> } })['ng-add']?.targetVersions ?? {};

interface Schema {
  project?: string;
}

// ---------------------------------------------------------------------------
// Step 1: Allineamento dipendenze
// ---------------------------------------------------------------------------
function alignDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('package.json')) {
      throw new SchematicsException('package.json non trovato.');
    }

    const pkgJson = JSON.parse(tree.read('package.json')!.toString('utf-8'));
    const deps: Record<string, string> = pkgJson.dependencies ?? {};
    const devDeps: Record<string, string> = pkgJson.devDependencies ?? {};

    const angularVersion = LIB_TARGET_VERSIONS['@angular/core'] ?? '^21.0.0';
    // I build tool (@angular/build, @angular/cli, @angular/compiler-cli) seguono
    // un versioning proprio: usare solo il major evita errori "version not found"
    const majorMatch = angularVersion.match(/\d+/);
    const angularMajorVersion = majorMatch ? `^${majorMatch[0]}.0.0` : angularVersion;
    const BUILD_TOOLS = new Set(['@angular/build', '@angular/cli', '@angular/compiler-cli']);
    let changed = false;

    // Aggiorna tutti i pacchetti @angular/* già presenti (sia deps che devDeps)
    // Priorità: versione specifica in peerDeps > major per build tool > versione core
    for (const section of [deps, devDeps]) {
      for (const pkg of Object.keys(section)) {
        if (pkg.startsWith('@angular/')) {
          const target = LIB_TARGET_VERSIONS[pkg] ?? (BUILD_TOOLS.has(pkg) ? angularMajorVersion : angularVersion);
          if (section[pkg] !== target) {
            context.logger.info(`  ✔ Allineato ${pkg}: ${section[pkg]} → ${target}`);
            section[pkg] = target;
            changed = true;
          }
        }
      }
    }

    // Aggiunge pacchetti Angular mancanti
    const angularExtras = ['@angular/animations', '@angular/material'];
    for (const pkg of angularExtras) {
      if (!deps[pkg] && !devDeps[pkg]) {
        const target = LIB_TARGET_VERSIONS[pkg] ?? angularVersion;
        deps[pkg] = target;
        context.logger.info(`  ✔ Aggiunta dipendenza: ${pkg}@${target}`);
        changed = true;
      }
    }

    // Aggiorna o aggiunge le peerDependencies non-Angular (tailwindcss, postcss, typescript…)
    const nonAngularPeers = Object.entries(LIB_TARGET_VERSIONS).filter(([pkg]) => !pkg.startsWith('@angular/'));
    for (const [pkg, version] of nonAngularPeers) {
      if (deps[pkg] && deps[pkg] !== version) {
        context.logger.info(`  ✔ Allineato ${pkg}: ${deps[pkg]} → ${version}`);
        deps[pkg] = version;
        changed = true;
      } else if (devDeps[pkg] && devDeps[pkg] !== version) {
        context.logger.info(`  ✔ Allineato ${pkg}: ${devDeps[pkg]} → ${version}`);
        devDeps[pkg] = version;
        changed = true;
      } else if (!deps[pkg] && !devDeps[pkg]) {
        deps[pkg] = version;
        context.logger.info(`  ✔ Aggiunta dipendenza: ${pkg}@${version}`);
        changed = true;
      }
    }

    if (changed) {
      pkgJson.dependencies = deps;
      pkgJson.devDependencies = devDeps;
      tree.overwrite('package.json', JSON.stringify(pkgJson, null, 2) + '\n');
      context.addTask(new NodePackageInstallTask());
      context.logger.info('  ✔ Dipendenze aggiornate, install schedulato');
    } else {
      context.logger.info('  ✔ Dipendenze già allineate');
    }
  };
}

// ---------------------------------------------------------------------------
// Step 2: Tailwind
// ---------------------------------------------------------------------------
function setupTailwind(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('.postcssrc.json')) {
      tree.create('.postcssrc.json', JSON.stringify({ plugins: { '@tailwindcss/postcss': {} } }, null, 2) + '\n');
      context.logger.info('  ✔ Creato .postcssrc.json');
    }
  };
}

// ---------------------------------------------------------------------------
// Step 3: angular.json — aggiunge preserveSymlinks, tema, assets ng-core-ui
// ---------------------------------------------------------------------------
function updateAngularJson(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const angularJsonPath = 'angular.json';
    if (!tree.exists(angularJsonPath)) {
      throw new SchematicsException('angular.json non trovato.');
    }

    const angularJson = JSON.parse(tree.read(angularJsonPath)!.toString('utf-8'));
    const projectName = options.project ?? angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];
    const project = angularJson.projects[projectName];

    if (!project) {
      throw new SchematicsException(`Progetto "${projectName}" non trovato in angular.json.`);
    }

    // Base href + budget doppi in production config
    const productionConfig = project.architect?.build?.configurations?.production;
    if (productionConfig) {
      if (!productionConfig.baseHref) {
        productionConfig.baseHref = '__BASE_HREF__';
        context.logger.info('  ✔ Impostato baseHref a __BASE_HREF__ nella configurazione production');
      }
      // Raddoppia le soglie di budget (default Angular: 500kB/1MB initial, 4kB/8kB component)
      productionConfig.budgets = [
        { type: 'initial',           maximumWarning: '1MB',  maximumError: '2MB' },
        { type: 'anyComponentStyle', maximumWarning: '8kB',  maximumError: '16kB' },
      ];
      context.logger.info('  ✔ Budget soglie raddoppiate (1MB/2MB initial, 8kB/16kB component)');
    }

    const buildOptions = project.architect?.build?.options;
    if (buildOptions) {
      // preserveSymlinks — necessario per librerie installate via link/file:
      if (!buildOptions.preserveSymlinks) {
        buildOptions.preserveSymlinks = true;
        context.logger.info('  ✔ Impostato preserveSymlinks: true');
      }

      // Stili
      buildOptions.styles = buildOptions.styles ?? [];
      const themeEntry = `node_modules/${LIB}/styles/themes.scss`;
      if (!buildOptions.styles.includes(themeEntry)) {
        buildOptions.styles.unshift(themeEntry);
        context.logger.info(`  ✔ Aggiunto ${themeEntry} agli stili`);
      }

      // Assets ng-core-ui
      buildOptions.assets = buildOptions.assets ?? [];
      const assetEntry = {
        glob: '**/*',
        input: `node_modules/${LIB}/assets`,
        output: 'assets/ng-core-ui',
      };
      const hasAsset = buildOptions.assets.some(
        (a: unknown) => typeof a === 'object' && (a as { input?: string }).input === assetEntry.input
      );
      if (!hasAsset) {
        buildOptions.assets.push(assetEntry);
        context.logger.info(`  ✔ Aggiunto asset mapping per ng-core-ui`);
      }
    }

    tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');
  };
}

// ---------------------------------------------------------------------------
// Step 4: styles.scss — aggiunge Tailwind e @source per ng-core-ui
// ---------------------------------------------------------------------------
function updateStylesScss(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const stylesPath = 'src/styles.scss';
    if (!tree.exists(stylesPath)) {
      tree.create(stylesPath, STYLES_TEMPLATE);
      context.logger.info('  ✔ Creato src/styles.scss');
      return;
    }

    let content = tree.read(stylesPath)!.toString('utf-8');
    let changed = false;

    if (!content.includes('@use "tailwindcss"') && !content.includes("@use 'tailwindcss'")) {
      content += `\n@use "tailwindcss";\n`;
      changed = true;
    }

    if (!content.includes(`@source "${LIB}"`) && !content.includes(`@source '${LIB}'`)) {
      content += `@source "${LIB}";\n`;
      changed = true;
    }

    if (changed) {
      tree.overwrite(stylesPath, content);
      context.logger.info('  ✔ Aggiornato src/styles.scss con Tailwind e @source ng-core-ui');
    } else {
      context.logger.info('  ✔ src/styles.scss già configurato');
    }
  };
}

const STYLES_TEMPLATE = `@use "tailwindcss";
@source "${LIB}";
`;

// ---------------------------------------------------------------------------
// Step 5: declarations.d.ts — costanti build-time AppSha / AppVersion
// ---------------------------------------------------------------------------
function createDeclarations(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const declPath = 'src/declarations.d.ts';
    if (!tree.exists(declPath)) {
      tree.create(declPath, `// Costanti iniettate dal build system tramite esbuild --define
declare const AppSha: string;
declare const AppVersion: string;
`);
      context.logger.info('  ✔ Creato src/declarations.d.ts');
    }
  };
}

// ---------------------------------------------------------------------------
// Step 6: app.config.ts — riscrittura pulita
// ---------------------------------------------------------------------------
function updateAppConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const configPath = 'src/app/app.config.ts';
    if (!tree.exists(configPath)) {
      context.logger.warn(`  ⚠ ${configPath} non trovato. Aggiungi manualmente provideGPAUICore() ai providers.`);
      return;
    }

    const content = tree.read(configPath)!.toString('utf-8');

    if (content.includes('provideGPAUICore')) {
      context.logger.info('  ✔ app.config.ts già configurato');
      return;
    }

    // Rileva i provider Angular già presenti nel file
    const hasZoneless = content.includes('provideZonelessChangeDetection');
    const hasBrowserErrors = content.includes('provideBrowserGlobalErrorListeners');

    tree.overwrite(configPath, buildAppConfigContent(hasZoneless, hasBrowserErrors));
    context.logger.info('  ✔ Aggiornato app.config.ts');

    // Rimuovi app.routes.ts — sostituito da app.routes.config.ts
    if (tree.exists('src/app/app.routes.ts')) {
      tree.delete('src/app/app.routes.ts');
      context.logger.info('  ✔ Rimosso src/app/app.routes.ts (sostituito da app.routes.config.ts)');
    }
  };
}

function buildAppConfigContent(zoneless: boolean, browserErrors: boolean): string {
  const coreSymbols = ['ApplicationConfig'];
  const providers: string[] = [];

  if (browserErrors) {
    coreSymbols.push('provideBrowserGlobalErrorListeners');
    providers.push('provideBrowserGlobalErrorListeners()');
  }
  if (zoneless) {
    coreSymbols.push('provideZonelessChangeDetection');
    providers.push('provideZonelessChangeDetection()');
  }

  providers.push(
    `provideRouter(toRoutes(APP_ROUTES))`,
    `provideHttpClient()`,
    `provideGPAUICore()`,
  );

  return `import { ${coreSymbols.join(', ')} } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideGPAUICore, toRoutes } from '${LIB}';
import { APP_ROUTES } from './app.routes.config';

export const appConfig: ApplicationConfig = {
  providers: [
    ${providers.join(',\n    ')},
  ],
};
`;
}

// ---------------------------------------------------------------------------
// Step 7: app.routes.config.ts (nuova fonte di verità)
// ---------------------------------------------------------------------------
function createRoutesConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = 'src/app/app.routes.config.ts';
    if (!tree.exists(path)) {
      tree.create(path, ROUTES_CONFIG_TEMPLATE);
      context.logger.info('  ✔ Creato src/app/app.routes.config.ts');
    } else {
      context.logger.info('  ✔ app.routes.config.ts già presente');
    }
  };
}

// ---------------------------------------------------------------------------
// Step 9: pagina Home
// ---------------------------------------------------------------------------
function createHomeComponent(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const tsPath  = 'src/app/pages/home/home.component.ts';
    const htmlPath = 'src/app/pages/home/home.component.html';

    if (tree.exists(tsPath)) {
      context.logger.info('  ✔ HomeComponent già presente');
      return;
    }

    // Legge il nome del progetto da package.json per personalizzare il testo
    let appName = 'App';
    if (tree.exists('package.json')) {
      const pkg = JSON.parse(tree.read('package.json')!.toString('utf-8'));
      if (pkg.name) {
        appName = pkg.name
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }

    tree.create(tsPath, HOME_COMPONENT_TS);
    tree.create(htmlPath, buildHomeHtml(appName));
    context.logger.info('  ✔ Creato src/app/pages/home/home.component.ts');
    context.logger.info('  ✔ Creato src/app/pages/home/home.component.html');
  };
}

// ---------------------------------------------------------------------------
// Step 8: scripts/generate-routes.ts
// ---------------------------------------------------------------------------
function createGenerateRoutesScript(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const scriptPath = 'scripts/generate-routes.ts';
    if (!tree.exists(scriptPath)) {
      tree.create(scriptPath, GENERATE_ROUTES_SCRIPT);
      context.logger.info('  ✔ Creato scripts/generate-routes.ts');
    }
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
const ROUTES_CONFIG_TEMPLATE = `import type { CoreRoute } from '${LIB}';

export const APP_ROUTES: CoreRoute[] = [
  {
    id: 'home',
    path: '',
    description: 'Home',
    icon: 'home',
    ismenu: true,
    order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  // Aggiungi qui le altre rotte della tua applicazione, es:
  // {
  //   id: 'dashboard',
  //   path: 'dashboard',
  //   description: 'Dashboard',
  //   icon: 'dashboard',
  //   ismenu: true,
  //   order: 1,
  //   loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  // },
];
`;

const HOME_COMPONENT_TS = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [MatIconModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
`;

function buildHomeHtml(appName: string): string {
  return `<div class="flex items-center justify-center min-h-[70vh]">
  <div class="flex flex-col items-center gap-4 bg-white p-8 py-6 rounded-xl shadow-lg">
    <mat-icon aria-hidden="true" class="text-[64px]! text-blue-600 mb-2">home</mat-icon>
    <h1 class="text-[2.2rem] font-bold text-neutral-800 m-0">Benvenuto!</h1>
    <p class="text-[1.1rem] text-neutral-600 text-center m-0">
      Questa è la home page di <strong>${appName}</strong>.<br />Seleziona una funzionalità dal menu laterale.
    </p>
  </div>
</div>
`;
}

// ---------------------------------------------------------------------------
// Step 10: app.html — rimpiazza il template di default con solo router-outlet
// ---------------------------------------------------------------------------
function cleanAppHtml(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Angular 21+ usa app.html, versioni precedenti usano app.component.html
    const candidates = ['src/app/app.html', 'src/app/app.component.html'];
    for (const path of candidates) {
      if (tree.exists(path)) {
        tree.overwrite(path, '<router-outlet />\n');
        context.logger.info(`  ✔ Ripulito ${path} con <router-outlet />`);
        return;
      }
    }
  };
}

const GENERATE_ROUTES_SCRIPT = `import { APP_ROUTES } from '../src/app/app.routes.config';
import { toRoutesJson } from '${LIB}';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Importa APP_ACTIONS se hai definito src/app/app.actions.config.ts
// import { APP_ACTIONS } from '../src/app/app.actions.config';

const outDir = join(import.meta.dir, '..', 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'routes.json'), JSON.stringify(toRoutesJson(APP_ROUTES /*, APP_ACTIONS */), null, 2));
console.log('routes.json written');
`;


// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export function ngAdd(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('📦 Configurazione ng-core-ui...');
    return chain([
      alignDependencies(),
      setupTailwind(),
      updateAngularJson(options),
      updateStylesScss(),
      createDeclarations(),
      updateAppConfig(),
      createRoutesConfig(),
      createHomeComponent(),
      cleanAppHtml(),
      createGenerateRoutesScript(),
    ])(tree, context);
  };
}
