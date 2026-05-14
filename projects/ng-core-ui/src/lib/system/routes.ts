
import { Routes } from '@angular/router';
import { Type } from '@angular/core';

import { MenuGuard } from './menu.guard';
import { FullLayoutComponent } from '../layout/full-layout/full-layout.component';
import { RightLayoutComponent } from '../layout/right-layout/right-layout.component';
import { SimpleLayoutComponent } from '../layout/simple-layout/simple-layout.component';
import { ForbiddenPage } from '../pages/forbidden.page';
import { NotFoundPage } from '../pages/not-found.page';

export type { CoreAction, CoreRouteBase, CoreRouteEntry } from './routes-export';
export { toRoutesList, toRoutesYaml, toRoutesMongo } from './routes-export';
import type { CoreRouteBase } from './routes-export';
import {ErrorPage} from '../pages/error.page';

export interface CoreRoute extends CoreRouteBase {
  loadComponent?: () => Promise<Type<unknown> | { default: Type<unknown> }>;
}

export interface CoreRoutesOptions {
  layout?: 'full' | 'right' | 'simple';
  guard?: boolean;
}

export function toRoutes(routes: CoreRoute[], options?: CoreRoutesOptions): Routes {
  const layout = options?.layout ?? 'full';
  const guard = options?.guard ?? true;
  const layoutComponent =
    layout === 'full'  ? FullLayoutComponent  :
    layout === 'right' ? RightLayoutComponent :
    SimpleLayoutComponent;

  return [
    {
      path: '',
      component: layoutComponent,
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

