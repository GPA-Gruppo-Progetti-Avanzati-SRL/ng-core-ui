import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

const SCRIPTS: Record<string, string> = {
  'generate-acl':   `node node_modules/${LIB}/bin/generate-acl.mjs`,
  'generate-mongo': `node node_modules/${LIB}/bin/generate-mongo.mjs`,
  'generate-page':  `ng generate ${LIB}:page`,
};

export function createGenerateRoutesScript(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pkgPath = 'package.json';
    const raw = tree.read(pkgPath);
    if (!raw) {
      context.logger.warn('  ⚠ package.json not found — skipping scripts setup');
      return;
    }

    const pkg = JSON.parse(raw.toString('utf-8')) as { scripts?: Record<string, string> };
    pkg.scripts = pkg.scripts ?? {};

    let changed = false;
    for (const [name, cmd] of Object.entries(SCRIPTS)) {
      if (pkg.scripts[name]) {
        context.logger.info(`  ⓘ script "${name}" già presente in package.json — skipped`);
      } else {
        pkg.scripts[name] = cmd;
        context.logger.info(`  ✔ Aggiunto script "${name}" a package.json`);
        changed = true;
      }
    }

    if (changed) {
      tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }
  };
}
