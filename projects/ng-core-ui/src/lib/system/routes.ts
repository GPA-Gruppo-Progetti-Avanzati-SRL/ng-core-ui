
import { Routes } from '@angular/router';
import { Type } from '@angular/core';

import { MenuGuard } from './menu.guard';
import { MainLayoutComponent } from '../layout/main-layout/main-layout.component';
import { SimpleLayoutComponent } from '../layout/simple-layout/simple-layout.component';
import { ForbiddenPage } from '../pages/forbidden.page';
import { NotFoundPage } from '../pages/not-found.page';

export type { CoreAction, CoreRouteBase, CoreRouteEntry } from './routes-export';
export { toRoutesList, toRoutesYaml } from './routes-export';
import type { CoreRouteBase } from './routes-export';
import {ErrorPage} from '../pages/error.page';

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
          path: r.endpoint ?? '',
          loadComponent: r.loadComponent!,
        })),
        { path: 'error', component: ErrorPage },
        { path: 'forbidden', component: ForbiddenPage },
        { path: '**', component: NotFoundPage },
      ],
    },
  ];
}

