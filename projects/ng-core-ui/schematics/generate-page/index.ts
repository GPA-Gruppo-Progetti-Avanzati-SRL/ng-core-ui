import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Schema } from './types';

// 'user-list' → 'UserList'
function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

// 'userList' or 'UserList' → 'user-list'
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function buildComponentTs(kebabName: string): string {
  const pascal = toPascalCase(kebabName);
  return `import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-${kebabName}',
  imports: [],
  templateUrl: './${kebabName}.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ${pascal}Component {}
`;
}

function buildComponentHtml(description: string): string {
  return `<div class="flex flex-col gap-4 p-6">
  <h1 class="text-2xl font-bold text-on-surface">${description}</h1>
</div>
`;
}

function buildRouteEntry(appId: string, kebabName: string, options: Schema): string {
  const menu = options.menu !== false;
  return `  {
    id: 'cap:${appId}:ui:${kebabName}',
    endpoint: '/${kebabName}',
    description: '${options.description}',
    icon: '${options.icon ?? 'chevron_right'}',
    menu: ${menu},
    order: ${options.order},
    loadComponent: () => import('./pages/${kebabName}/${kebabName}.component').then(m => m.${toPascalCase(kebabName)}Component),
  },`;
}

export function generatePage(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('angular.json')) {
      throw new SchematicsException('angular.json non trovato. Eseguire dalla root del progetto Angular.');
    }

    const angularJson = JSON.parse(tree.read('angular.json')!.toString('utf-8'));
    const projectName: string =
      angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];

    if (!projectName) {
      throw new SchematicsException('Impossibile determinare il nome del progetto Angular.');
    }

    const kebabName = toKebabCase(options.name);
    const tsPath   = `src/app/pages/${kebabName}/${kebabName}.component.ts`;
    const htmlPath = `src/app/pages/${kebabName}/${kebabName}.component.html`;
    const routesPath = 'src/app/app.routes.config.ts';

    // Crea i file del componente
    if (tree.exists(tsPath)) {
      throw new SchematicsException(`Il componente "${kebabName}" esiste già in ${tsPath}.`);
    }
    tree.create(tsPath, buildComponentTs(kebabName));
    tree.create(htmlPath, buildComponentHtml(options.description));
    context.logger.info(`  ✔ Creato ${tsPath}`);
    context.logger.info(`  ✔ Creato ${htmlPath}`);

    // Aggiunge la rotta in app.routes.config.ts
    if (!tree.exists(routesPath)) {
      throw new SchematicsException(`${routesPath} non trovato. Verificare che ng-add sia stato eseguito.`);
    }
    const routesContent = tree.read(routesPath)!.toString('utf-8');
    const newEntry = buildRouteEntry(projectName, kebabName, options);

    // Inserisce la nuova rotta prima della chiusura dell'array `];`
    const updated = routesContent.replace(/^];$/m, `${newEntry}\n];`);
    if (updated === routesContent) {
      throw new SchematicsException(`Impossibile trovare la chiusura dell'array APP_ROUTES in ${routesPath}.`);
    }
    tree.overwrite(routesPath, updated);
    context.logger.info(`  ✔ Rotta 'cap:${projectName}:ui:${kebabName}' aggiunta in ${routesPath}`);
  };
}
