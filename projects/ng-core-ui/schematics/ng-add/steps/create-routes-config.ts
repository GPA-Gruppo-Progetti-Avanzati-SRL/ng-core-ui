import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';
import { Schema } from '../types';

function buildRoutesConfig(appId: string): string {
  return `import type { CoreRoute } from '${LIB}';

export const APP_ROUTES: CoreRoute[] = [
  {
    id: 'cap:${appId}:ui:home',
    endpoint: '',
    name :'Home',
    description: 'Home',
    icon: 'home',
    menu: true,
    order: 0,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  // Aggiungi qui le altre rotte della tua applicazione, es:
  // {
  //   id: 'cap:${appId}:ui:dashboard',
  //   endpoint: 'dashboard',
  //   description: 'Dashboard',
  //   icon: 'dashboard',
  //   menu: true,
  //   order: 1,
  //   loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  // },
];
`;
}

export function createRoutesConfig(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const angularJson = JSON.parse(tree.read('angular.json')!.toString('utf-8'));
    const projectName: string =
      options.project ?? angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];

    if (!projectName) {
      throw new SchematicsException('Impossibile determinare il nome del progetto Angular.');
    }

    const path = 'src/app/app.routes.config.ts';
    if (!tree.exists(path)) {
      tree.create(path, buildRoutesConfig(projectName));
      context.logger.info('  ✔ Creato src/app/app.routes.config.ts');
    } else {
      context.logger.info('  ✔ app.routes.config.ts già presente');
    }
  };
}
