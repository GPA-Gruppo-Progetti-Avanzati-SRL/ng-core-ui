import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

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

export function createRoutesConfig(): Rule {
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
