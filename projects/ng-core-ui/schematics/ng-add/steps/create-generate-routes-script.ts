import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

// Inlined to avoid importing Angular — this script runs in Node/Bun outside the Angular build.
const GENERATE_ROUTES_SCRIPT = `import { APP_ROUTES } from '../src/app/app.routes.config';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Importa APP_ACTIONS se hai definito src/app/app.actions.config.ts
// import { APP_ACTIONS } from '../src/app/app.actions.config';

interface CoreRouteBase { id: string; description?: string; icon?: string; path?: string; order?: number; ismenu?: boolean; }
interface CoreAction { id: string; description?: string; }
type CoreRouteEntry = ({ type: 'ui' } & CoreRouteBase) | { type: 'ui_action'; id: string; description?: string };

function toRoutesJson(routes: CoreRouteBase[], actions?: CoreAction[]): CoreRouteEntry[] {
  const ui: CoreRouteEntry[] = routes.map(({ id, description, icon, path, order, ismenu }) => ({
    type: 'ui', id: id.toUpperCase(),
    ...(description !== undefined && { description }),
    ...(icon !== undefined && { icon }),
    path: path != null ? (path === '' ? '/' : path.startsWith('/') ? path : \`/\${path}\`) : undefined,
    ...(order !== undefined && { order }),
    ...(ismenu !== undefined && { ismenu }),
  }));
  const ui_action: CoreRouteEntry[] = (actions ?? []).map(a => ({
    type: 'ui_action' as const, id: a.id.toUpperCase(),
    ...(a.description !== undefined && { description: a.description }),
  }));
  return [...ui, ...ui_action];
}

const outDir = join(import.meta.dir, '..', 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'routes.json'), JSON.stringify(toRoutesJson(APP_ROUTES /*, APP_ACTIONS */), null, 2));
console.log('routes.json written');
`;

export function createGenerateRoutesScript(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const scriptPath = 'scripts/generate-routes.ts';
    if (!tree.exists(scriptPath)) {
      tree.create(scriptPath, GENERATE_ROUTES_SCRIPT);
      context.logger.info('  ✔ Creato scripts/generate-routes.ts');
    }
  };
}
