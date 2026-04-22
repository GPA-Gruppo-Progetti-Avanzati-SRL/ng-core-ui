/**
 * Pure TypeScript utilities for serializing route/action definitions to JSON.
 * No Angular dependencies — safe to import from Node.js / Bun build scripts.
 */

export interface CoreAction {
  id: string;
  description?: string;
}

/** Subset of CoreRoute used for JSON serialization (no loadComponent). */
export interface CoreRouteBase {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  endpoint?: string;
  order?: number;
  menu?: boolean;
}

export type CoreRouteEntry =
  | ({ category: 'ui' } & Omit<CoreRouteBase, never>)
  | { category: 'action'; id: string; description?: string };

function entryToYaml(e: CoreRouteEntry): string {
  const lines: string[] = [`  - category: ${e.category}`, `    id: ${e.id}`];
  const rest = e as Record<string, unknown>;
  for (const key of ['name', 'description', 'icon', 'endpoint', 'order', 'menu']) {
    if (rest[key] !== undefined) lines.push(`    ${key}: ${rest[key]}`);
  }
  return lines.join('\n');
}

export function toRoutesYaml(routes: CoreRouteBase[], actions?: CoreAction[]): string {
  const entries = toRoutesList(routes, actions);
  return 'cap_defs:\n' + entries.map(entryToYaml).join('\n') + '\n';
}

export function toRoutesList(routes: CoreRouteBase[], actions?: CoreAction[]): CoreRouteEntry[] {
  const ui: CoreRouteEntry[] = routes.map(({ id, name, description, icon, endpoint, order, menu }) => ({
    category: 'ui',
    id: id,
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    endpoint: endpoint != null ? (endpoint === '' ? '/' : endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : undefined,
    ...(order !== undefined && { order }),
    ...(menu !== undefined && { menu }),
  }));

  const action: CoreRouteEntry[] = (actions ?? []).map(a => ({
    category: 'action' as const,
    id: a.id,
    ...(a.description !== undefined && { description: a.description }),
  }));

  return [...ui, ...action];
}
