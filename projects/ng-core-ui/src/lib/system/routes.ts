import { Routes } from '@angular/router';
import { Type } from '@angular/core';

import { MenuGuard } from './menu.guard';
import { MainLayoutComponent } from '../layout/main-layout/main-layout.component';
import { SimpleLayoutComponent } from '../layout/simple-layout/simple-layout.component';
import { ForbiddenComponent } from '../forbidden/forbidden.component';
import { NotFoundComponent } from '../not-found/not-found.component';

export interface CoreAction {
  id: string;
  description?: string;
}


export interface CoreRoute {
  id: string;
  description?: string;
  icon?: string;
  path?: string;
  order?: number;
  ismenu?: boolean;
  loadComponent?: () => Promise<Type<unknown> | { default: Type<unknown> }>;
}

export interface CoreRoutesOptions {
  layout?: 'main' | 'simple';
  guard?: boolean;
}

export type CoreRouteEntry =
  | ({ type: 'ui' } & Omit<CoreRoute, 'loadComponent'>)
  | { type: 'ui_action'; id: string; description?: string };

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

export function toRoutesJson(routes: CoreRoute[], actions?: CoreAction[]): CoreRouteEntry[] {
  const ui: CoreRouteEntry[] = routes.map(({ id, description, icon, path, order, ismenu }) => ({
    type: 'ui',
    id: id.toUpperCase(),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    path: path != null ? (path === '' ? '/' : path.startsWith('/') ? path : `/${path}`) : undefined,
    ...(order !== undefined && { order }),
    ...(ismenu !== undefined && { ismenu }),
  }));

  const ui_action: CoreRouteEntry[] = (actions ?? []).map(a => ({
    type: 'ui_action' as const,
    id: a.id.toUpperCase(),
    ...(a.description !== undefined && { description: a.description }),
  }));

  return [...ui, ...ui_action];
}
