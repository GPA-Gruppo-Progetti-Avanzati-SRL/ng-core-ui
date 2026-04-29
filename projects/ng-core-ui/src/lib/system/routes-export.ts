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

export interface CoreRouteEntry {
  category: 'ui' | 'action';
  _id: string;
  name?: string;
  description?: string;
  icon?: string;
  endpoint?: string;
  order?: number;
  menu?: boolean;
}

function entryToYaml(e: CoreRouteEntry, appId: string): string {
  const lines: string[] = [
    `  - category: ${e.category}`,
    `    _id: "${e._id}"`,
    `    app: "${appId}"`,
  ];
  const rest = e as unknown as Record<string, unknown>;
  const stringKeys = new Set(['name', 'description', 'icon', 'endpoint']);
  for (const key of ['name', 'description', 'icon', 'endpoint', 'order', 'menu']) {
    if (rest[key] !== undefined) {
      const val = stringKeys.has(key) ? `"${rest[key]}"` : rest[key];
      lines.push(`    ${key}: ${val}`);
    }
  }
  return lines.join('\n');
}

export function toRoutesYaml(routes: CoreRouteBase[], actions?: CoreAction[], appId = '', appDescription = ''): string {
  const entries = toRoutesList(routes, actions);
  const capDefs = 'cap_defs:\n' + entries.map(e => entryToYaml(e, appId)).join('\n') + '\n';
  const capabilities = entries.map(e => `    - "${e._id}"`).join('\n');
  const capGroups = `cap_groups:\n  - _id: "grp:${appId}:ALL"\n    description: ${appDescription}\n    capabilities:\n${capabilities}\n`;
  return capDefs + capGroups;
}

export function toRoutesList(routes: CoreRouteBase[], actions?: CoreAction[]): CoreRouteEntry[] {
  const ui: CoreRouteEntry[] = routes.map((r) => {
    const { name, description, icon, endpoint, order, menu } = r;
    const _id = r.id;
    return {
      category: 'ui' as const,
      _id,
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      endpoint: endpoint != null ? (endpoint === '' ? '/' : endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : undefined,
      ...(order !== undefined && { order }),
      ...(menu !== undefined && { menu }),
    };
  });

  const action: CoreRouteEntry[] = (actions ?? []).map(a => ({
    category: 'action' as const,
    _id: a.id,
    ...(a.description !== undefined && { description: a.description }),
  }));

  return [...ui, ...action];
}
