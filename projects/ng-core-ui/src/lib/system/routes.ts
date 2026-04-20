
import { Routes } from '@angular/router';
import { Type } from '@angular/core';

import { MenuGuard } from './menu.guard';
import { MainLayoutComponent } from '../layout/main-layout/main-layout.component';
import { SimpleLayoutComponent } from '../layout/simple-layout/simple-layout.component';
import { ForbiddenComponent } from '../forbidden/forbidden.component';
import { NotFoundComponent } from '../not-found/not-found.component';

export type { CoreAction, CoreRouteBase, CoreRouteEntry } from './routes-json';
export { toRoutesJson, toRoutesYaml } from './routes-json';
import type { CoreRouteBase } from './routes-json';

export interface CoreRoute extends CoreRouteBase {
  loadComponent?: () => Promise<Type<unknown> | { default: Type<unknown> }>;
}

export interface CoreRoutesOptions {
  layout?: 'main' | 'simple';
  guard?: boolean;
}

export function toRoutes(routes: CoreRoute[], options?: CoreRoutesOptions): Routes {
  const layout = options?.layout ?? 'main';
  const guard = options?.guard ?? true;

  return [
    {
      path: '',
      component: layout === 'main' ? MainLayoutComponent : SimpleLayoutComponent,
      ...(guard ? { canActivateChild: [MenuGuard] } : {}),
      children: [
        ...routes.map(r => ({
          path: r.path ?? r.id,
          loadComponent: r.loadComponent!,
        })),
        { path: 'forbidden', component: ForbiddenComponent },
        { path: '**', component: NotFoundComponent },
      ],
    },
  ];
}

