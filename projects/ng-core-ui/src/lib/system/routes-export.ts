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
  path?: string;
  order?: number;
  ismenu?: boolean;
}

export type CoreRouteEntry =
  | ({ category: 'ui' } & Omit<CoreRouteBase, never>)
  | { category: 'ui_action'; id: string; description?: string };

function entryToYaml(e: CoreRouteEntry): string {
  const lines: string[] = [`  - type: ${e.category}`, `    id: ${e.id}`];
  const rest = e as Record<string, unknown>;
  for (const key of ['name', 'description', 'icon', 'path', 'order', 'ismenu']) {
    if (rest[key] !== undefined) lines.push(`    ${key}: ${rest[key]}`);
  }
  return lines.join('\n');
}

export function toRoutesYaml(routes: CoreRouteBase[], actions?: CoreAction[]): string {
  const entries = toRoutesList(routes, actions);
  return 'cap_defs:\n' + entries.map(entryToYaml).join('\n') + '\n';
}

export function toRoutesList(routes: CoreRouteBase[], actions?: CoreAction[]): CoreRouteEntry[] {
  const ui: CoreRouteEntry[] = routes.map(({ id, name, description, icon, path, order, ismenu }) => ({
    category: 'ui',
    id: id,
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    path: path != null ? (path === '' ? '/' : path.startsWith('/') ? path : `/${path}`) : undefined,
    ...(order !== undefined && { order }),
    ...(ismenu !== undefined && { ismenu }),
  }));

  const ui_action: CoreRouteEntry[] = (actions ?? []).map(a => ({
    category: 'ui_action' as const,
    id: a.id,
    ...(a.description !== undefined && { description: a.description }),
  }));

  return [...ui, ...ui_action];
}
