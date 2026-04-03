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

interface Schema {
  appId: string;
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
    context.logger.info('  ✔ npm install schedulato');
  };
}

// ---------------------------------------------------------------------------
// Step 2: Tailwind
// ---------------------------------------------------------------------------
function setupTailwind(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('tailwind.config.js')) {
      tree.create('tailwind.config.js', TAILWIND_CONFIG);
      context.logger.info('  ✔ Creato tailwind.config.js');
    } else {
      context.logger.warn('  ⚠ tailwind.config.js già presente — verifica prefix "ui:" e important ".ui"');
    }

    if (!tree.exists('.postcssrc.json')) {
      tree.create('.postcssrc.json', JSON.stringify({ plugins: { '@tailwindcss/postcss': {} } }, null, 2) + '\n');
      context.logger.info('  ✔ Creato .postcssrc.json');
    }
  };
}

const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  prefix: 'ui:',
  important: '.ui',
  theme: { extend: {} },
  plugins: [],
};
`;

// ---------------------------------------------------------------------------
// Step 3: angular.json — aggiunge il tema Material al progetto
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
      buildOptions.styles = buildOptions.styles ?? [];
      const themeEntry = 'node_modules/ng-core-ui/styles/themes.scss';
      if (!buildOptions.styles.includes(themeEntry)) {
        buildOptions.styles.unshift(themeEntry);
        context.logger.info(`  ✔ Aggiunto ${themeEntry} agli stili di angular.json`);
      }
    }

    tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');
  };
}

// ---------------------------------------------------------------------------
// Step 4: app.config.ts — aggiunge i provider necessari
// ---------------------------------------------------------------------------
function updateAppConfig(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const configPath = 'src/app/app.config.ts';
    if (!tree.exists(configPath)) {
      context.logger.warn(`  ⚠ ${configPath} non trovato. Aggiungi manualmente:`);
      context.logger.warn(manualConfigHint(options));
      return;
    }

    let content = tree.read(configPath)!.toString('utf-8');
    let changed = false;

    // Aggiungi imports mancanti
    if (!content.includes('provideGPAUICore')) {
      content = `import { provideGPAUICore } from 'ng-core-ui';\n` + content;
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

    // Inserisci i provider all'inizio dell'array providers
    const providersRegex = /providers:\s*\[/;
    if (providersRegex.test(content) && !content.includes('provideGPAUICore(')) {
      const providerBlock = [
        `provideGPAUICore('${options.appId}', AppSha, AppVersion)`,
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
// Step 5: declarations.d.ts — costanti iniettate a build time
// ---------------------------------------------------------------------------
function createDeclarations(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const declPath = 'src/declarations.d.ts';
    if (!tree.exists(declPath)) {
      tree.create(declPath, `// Costanti iniettate dal build system (es. webpack DefinePlugin / esbuild define)
declare const AppSha: string;
declare const AppVersion: string;
`);
      context.logger.info('  ✔ Creato src/declarations.d.ts');
    }
  };
}

// ---------------------------------------------------------------------------
// Step 6: app.routes.ts — aggiunge layout shell, MenuGuard, forbidden, not-found
// ---------------------------------------------------------------------------
function updateAppRoutes(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const routesPath = 'src/app/app.routes.ts';
    if (!tree.exists(routesPath)) {
      context.logger.warn(`  ⚠ ${routesPath} non trovato. Aggiungi manualmente:`);
      context.logger.warn(manualRoutesHint(options));
      return;
    }

    const content = tree.read(routesPath)!.toString('utf-8');

    // Non sovrascrivere se le rotte sono già configurate
    if (content.includes('NotFoundComponent') || content.includes('ForbiddenComponent')) {
      context.logger.info('  ✔ app.routes.ts già configurato');
      return;
    }

    tree.overwrite(routesPath, buildRoutesFile());
    context.logger.info('  ✔ app.routes.ts configurato con MainLayoutComponent, MenuGuard, /forbidden e **');
  };
}

function buildRoutesFile(): string {
  return `import { Routes } from '@angular/router';
import {
  MainLayoutComponent,
  NotFoundComponent,
  ForbiddenComponent,
  MenuGuard,
} from 'ng-core-ui';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivateChild: [MenuGuard],
    children: [
      // Aggiungi qui le rotte della tua applicazione
      // { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
    ],
  },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', component: NotFoundComponent },
];
`;
}

// ---------------------------------------------------------------------------
// Hint testuali per configurazione manuale
// ---------------------------------------------------------------------------
function manualConfigHint(options: Schema): string {
  return `
// app.config.ts
import { provideGPAUICore } from 'ng-core-ui';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGPAUICore('${options.appId}', AppSha, AppVersion),
    provideHttpClient(),
    provideAnimationsAsync(),
    // ... altri provider
  ]
};`;
}

function manualRoutesHint(_options: Schema): string {
  return `
// app.routes.ts
import { Routes } from '@angular/router';
import { MainLayoutComponent, NotFoundComponent, ForbiddenComponent, MenuGuard } from 'ng-core-ui';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivateChild: [MenuGuard],
    children: [],
  },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: '**', component: NotFoundComponent },
];`;
}

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
      createDeclarations(),
      updateAppConfig(options),
      updateAppRoutes(options),
    ])(tree, context);
  };
}
