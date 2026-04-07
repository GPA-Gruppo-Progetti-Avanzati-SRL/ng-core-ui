import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  SchematicsException,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType,
  getPackageJsonDependency,
} from '@schematics/angular/utility/dependencies';

const LIB = '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

interface Schema {
  project?: string;
}

/** Peer dependencies che l'app deve avere installate */
const PEER_DEPS: NodeDependency[] = [
  { type: NodeDependencyType.Default, name: '@angular/animations',   version: '^21.2.7', overwrite: false },
  { type: NodeDependencyType.Default, name: '@angular/material',      version: '^21.2.7', overwrite: false },
  { type: NodeDependencyType.Default, name: 'tailwindcss',            version: '4',       overwrite: false },
  { type: NodeDependencyType.Default, name: '@tailwindcss/postcss',   version: '^4.2.1',  overwrite: false },
];

// ---------------------------------------------------------------------------
// Step 1: Dipendenze
// ---------------------------------------------------------------------------
function addDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    for (const dep of PEER_DEPS) {
      if (!getPackageJsonDependency(tree, dep.name)) {
        addPackageJsonDependency(tree, dep);
        context.logger.info(`  ✔ Aggiunta dipendenza: ${dep.name}@${dep.version}`);
      }
    }
    context.addTask(new NodePackageInstallTask());
    context.logger.info('  ✔ install schedulato');
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
// Step 3: angular.json — aggiunge tema e assets ng-core-ui
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

    const buildOptions = project.architect?.build?.options;
    if (buildOptions) {
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
// Step 5: app.config.ts
// ---------------------------------------------------------------------------
function updateAppConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const configPath = 'src/app/app.config.ts';
    if (!tree.exists(configPath)) {
      context.logger.warn(`  ⚠ ${configPath} non trovato. Aggiungi manualmente:`);
      context.logger.warn(MANUAL_CONFIG_HINT);
      return;
    }

    let content = tree.read(configPath)!.toString('utf-8');
    let changed = false;

    if (!content.includes('provideGPAUICore') || !content.includes('toRoutes')) {
      content = `import { provideGPAUICore, toRoutes } from '${LIB}';\n` + content;
      changed = true;
    }
    if (!content.includes('APP_ROUTES')) {
      content = `import { APP_ROUTES } from './app.routes.config';\n` + content;
      changed = true;
    }
    if (!content.includes('provideHttpClient')) {
      content = `import { provideHttpClient } from '@angular/common/http';\n` + content;
      changed = true;
    }
    if (!content.includes('provideAnimationsAsync')) {
      content = `import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';\n` + content;
      changed = true;
    }

    // Sostituisci provideRouter(routes) con provideRouter(toRoutes(APP_ROUTES))
    if (content.includes('provideRouter(routes)')) {
      content = content.replace('provideRouter(routes)', 'provideRouter(toRoutes(APP_ROUTES))');
      changed = true;
    }

    const providersRegex = /providers:\s*\[/;
    if (providersRegex.test(content) && !content.includes('provideGPAUICore(')) {
      const providerBlock = [
        `provideRouter(toRoutes(APP_ROUTES))`,
        `provideGPAUICore()`,
        `provideHttpClient()`,
        `provideAnimationsAsync()`,
      ].join(',\n    ');
      content = content.replace(providersRegex, `providers: [\n    ${providerBlock},`);
      changed = true;
    }

    if (changed) {
      tree.overwrite(configPath, content);
      context.logger.info('  ✔ Aggiornato app.config.ts');
    } else {
      context.logger.info('  ✔ app.config.ts già configurato');
    }
  };
}

// ---------------------------------------------------------------------------
// Step 6: app.routes.config.ts (nuova fonte di verità)
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
  // Aggiungi qui le rotte della tua applicazione, es:
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


const GENERATE_ROUTES_SCRIPT = `import { APP_ROUTES } from '../src/app/app.routes.config';
import { APP_ACTIONS } from '../src/app/app.actions.config';
import { toRoutesJson } from '${LIB}';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const outDir = join(import.meta.dir, '..', 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'routes.json'), JSON.stringify(toRoutesJson(APP_ROUTES, APP_ACTIONS), null, 2));
console.log('routes.json written');
`;

const MANUAL_CONFIG_HINT = `
import { provideGPAUICore } from '${LIB}';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

providers: [
  provideGPAUICore(),
  provideHttpClient(),
  provideAnimationsAsync(),
]`;

const MANUAL_CONFIG_HINT_ROUTES = `
// In app.config.ts:
import { provideGPAUICore, toRoutes } from '${LIB}';
import { APP_ROUTES } from './app.routes.config';

provideRouter(toRoutes(APP_ROUTES))
`;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export function ngAdd(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('📦 Configurazione ng-core-ui...');
    return chain([
      addDependencies(),
      setupTailwind(),
      updateAngularJson(options),
      updateStylesScss(),
      createDeclarations(),
      updateAppConfig(),
      createRoutesConfig(),
      createGenerateRoutesScript(),
    ])(tree, context);
  };
}
