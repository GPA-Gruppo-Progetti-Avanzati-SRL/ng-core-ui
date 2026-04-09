import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

const SCRIPT_CMD = `bun node_modules/${LIB}/bin/generate-routes.mjs`;

export function createGenerateRoutesScript(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pkgPath = 'package.json';
    const raw = tree.read(pkgPath);
    if (!raw) {
      context.logger.warn('  ⚠ package.json not found — skipping generate-routes script setup');
      return;
    }

    const pkg = JSON.parse(raw.toString('utf-8')) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};

    if (scripts['generate-routes']) {
      context.logger.info('  ⓘ generate-routes script already present in package.json — skipping');
      return;
    }

    scripts['generate-routes'] = SCRIPT_CMD;
    pkg.scripts = scripts;
    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    context.logger.info('  ✔ Aggiunto script "generate-routes" a package.json');
  };
}
