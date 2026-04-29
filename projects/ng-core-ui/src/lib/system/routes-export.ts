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

export function toRoutesMongo(
  routes: CoreRouteBase[],
  actions?: CoreAction[],
  appId = '',
  appDescription = '',
): string {
  const entries = toRoutesList(routes, actions);
  const lines: string[] = [];

  for (const e of entries) {
    const doc: Record<string, unknown> = {
      _id: e._id,
      _et: 'cap-def',
      app: appId,
      category: e.category,
    };
    if (e.name        !== undefined) doc['name']        = e.name;
    if (e.description !== undefined) doc['description'] = e.description;
    if (e.endpoint    !== undefined) doc['endpoint']    = e.endpoint;
    if (e.icon        !== undefined) doc['icon']        = e.icon;
    if (e.order       !== undefined) doc['order']       = e.order;
    if (e.menu        !== undefined) doc['menu']        = e.menu;
    doc['sys_info'] = '__SYS_INFO__';

    const json = JSON.stringify(doc, null, 4)
      .replace('"__SYS_INFO__"', '{\n        status: "active",\n        created_at: new Date(),\n        modified_at: new Date()\n    }');

    lines.push(
      `db.getCollection(COLLECTION).replaceOne(\n` +
      `    { _id: ${JSON.stringify(e._id)} },\n` +
      `    ${json},\n` +
      `    { upsert: true }\n` +
      `)`,
    );
  }

  const capabilities = entries.map(e => `        ${JSON.stringify(e._id)}`).join(',\n');
  const groupId = `grp:${appId}:ALL`;
  const groupDoc =
    `{\n` +
    `    _id: ${JSON.stringify(groupId)},\n` +
    `    _et: "cap-group",\n` +
    `    description: ${JSON.stringify(appDescription)},\n` +
    `    capabilities: [\n${capabilities}\n    ],\n` +
    `    sys_info: {\n        status: "active",\n        created_at: new Date(),\n        modified_at: new Date()\n    }\n` +
    `}`;
  lines.push(
    `db.getCollection(COLLECTION).replaceOne(\n` +
    `    { _id: ${JSON.stringify(groupId)} },\n` +
    `    ${groupDoc},\n` +
    `    { upsert: true }\n` +
    `)`,
  );

  return `const COLLECTION = "acl";\n\n` + lines.join('\n\n') + '\n';
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

  const entries = [...ui, ...action];

  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  for (const e of entries) {
    const count = (seen.get(e._id) ?? 0) + 1;
    seen.set(e._id, count);
    if (count === 2) duplicates.push(e._id);
  }
  if (duplicates.length > 0) {
    throw new Error(
      `ACL generation failed — duplicate route/action IDs detected:\n` +
      duplicates.map(id => `  • ${id}`).join('\n') +
      `\n\nEach entry in APP_ROUTES and APP_ACTIONS must have a unique id.`,
    );
  }

  return entries;
}
