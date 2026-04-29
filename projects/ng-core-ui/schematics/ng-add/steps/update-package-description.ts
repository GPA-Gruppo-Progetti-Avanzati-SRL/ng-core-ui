import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from '../types';

export function updatePackageDescription(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!options.description) return;

    const pkgPath = 'package.json';
    const pkg = JSON.parse(tree.read(pkgPath)!.toString('utf-8'));
    pkg.description = options.description;
    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    context.logger.info(`  ✔ description aggiunta in package.json`);
  };
}
