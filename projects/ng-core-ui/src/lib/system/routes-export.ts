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

export function toRoutesSql(
  routes: CoreRouteBase[],
  actions?: CoreAction[],
  appId = '',
  appDescription = '',
  dialect: 'pg' | 'oracle' = 'pg',
): string {
  const entries = toRoutesList(routes, actions);
  const lines: string[] = [];
  const esc = (s: string) => s.replace(/'/g, "''");
  const groupId = `grp:${appId}:ALL`;

  if (dialect === 'oracle') {
    for (const e of entries) {
      const src =
        `SELECT '${esc(e._id)}' id,'${esc(appId)}' app,'${esc(e.category)}' category,` +
        `'${esc(e.description ?? '')}' description,'${esc(e.name ?? '')}' name,` +
        `'${esc(e.endpoint ?? '')}' endpoint,'${esc(e.icon ?? '')}' icon,` +
        `${e.order ?? 0} ord,${e.menu ? 1 : 0} menu FROM DUAL`;
      lines.push(
        `MERGE INTO opem_acl_cap_def tgt\n` +
        `USING (${src}) src\n` +
        `ON (tgt.id = src.id)\n` +
        `WHEN MATCHED THEN UPDATE SET\n` +
        `    tgt.app = src.app, tgt.category = src.category, tgt.description = src.description,\n` +
        `    tgt.name = src.name, tgt.endpoint = src.endpoint, tgt.icon = src.icon,\n` +
        `    tgt.ord = src.ord, tgt.menu = src.menu\n` +
        `WHEN NOT MATCHED THEN INSERT (id, app, category, description, name, endpoint, icon, ord, menu, mapping, method, status)\n` +
        `    VALUES (src.id, src.app, src.category, src.description, src.name, src.endpoint, src.icon, src.ord, src.menu, '', '', 'active');`,
      );
    }
    lines.push(
      `MERGE INTO opem_acl_cap_group tgt\n` +
      `USING (SELECT '${esc(groupId)}' id,'${esc(appDescription)}' description FROM DUAL) src\n` +
      `ON (tgt.id = src.id)\n` +
      `WHEN MATCHED THEN UPDATE SET tgt.description = src.description\n` +
      `WHEN NOT MATCHED THEN INSERT (id, description, status) VALUES (src.id, src.description, 'active');`,
    );
    for (const e of entries) {
      lines.push(
        `MERGE INTO opem_acl_cap_group_def tgt\n` +
        `USING (SELECT '${esc(groupId)}' cap_group_id,'${esc(e._id)}' cap_def_id FROM DUAL) src\n` +
        `ON (tgt.cap_group_id = src.cap_group_id AND tgt.cap_def_id = src.cap_def_id)\n` +
        `WHEN NOT MATCHED THEN INSERT (cap_group_id, cap_def_id) VALUES (src.cap_group_id, src.cap_def_id);`,
      );
    }
  } else {
    // PostgreSQL 9.5+: INSERT ... ON CONFLICT
    for (const e of entries) {
      lines.push(
        `INSERT INTO opem_acl_cap_def (id, app, category, description, name, endpoint, icon, ord, menu, mapping, method, status)\n` +
        `VALUES ('${esc(e._id)}', '${esc(appId)}', '${esc(e.category)}', '${esc(e.description ?? '')}', '${esc(e.name ?? '')}', '${esc(e.endpoint ?? '')}', '${esc(e.icon ?? '')}', ${e.order ?? 0}, ${e.menu ? 'TRUE' : 'FALSE'}, '', '', 'active')\n` +
        `ON CONFLICT (id) DO UPDATE SET\n` +
        `    app         = EXCLUDED.app,\n` +
        `    category    = EXCLUDED.category,\n` +
        `    description = EXCLUDED.description,\n` +
        `    name        = EXCLUDED.name,\n` +
        `    endpoint    = EXCLUDED.endpoint,\n` +
        `    icon        = EXCLUDED.icon,\n` +
        `    ord         = EXCLUDED.ord,\n` +
        `    menu        = EXCLUDED.menu;`,
      );
    }
    lines.push(
      `INSERT INTO opem_acl_cap_group (id, description, status)\n` +
      `VALUES ('${esc(groupId)}', '${esc(appDescription)}', 'active')\n` +
      `ON CONFLICT (id) DO UPDATE SET\n` +
      `    description = EXCLUDED.description;`,
    );
    for (const e of entries) {
      lines.push(
        `INSERT INTO opem_acl_cap_group_def (cap_group_id, cap_def_id)\n` +
        `VALUES ('${esc(groupId)}', '${esc(e._id)}')\n` +
        `ON CONFLICT DO NOTHING;`,
      );
    }
  }

  return lines.join('\n\n') + '\n';
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
