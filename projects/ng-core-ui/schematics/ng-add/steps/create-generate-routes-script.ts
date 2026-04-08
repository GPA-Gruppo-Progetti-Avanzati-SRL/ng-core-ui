import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

const GENERATE_ROUTES_SCRIPT = `import { APP_ROUTES } from '../src/app/app.routes.config';
import { toRoutesJson } from '${LIB}';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Importa APP_ACTIONS se hai definito src/app/app.actions.config.ts
// import { APP_ACTIONS } from '../src/app/app.actions.config';

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
