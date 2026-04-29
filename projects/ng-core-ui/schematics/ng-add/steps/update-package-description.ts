import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { Schema } from '../types';

export function updatePackageDescription(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pkgPath = 'package.json';
    const pkg = JSON.parse(tree.read(pkgPath)!.toString('utf-8'));

    if (options.description) {
      pkg.description = options.description;
      context.logger.info(`  ✔ description aggiunta in package.json`);
    }

    if (pkg.type !== 'module') {
      pkg.type = 'module';
      context.logger.info(`  ✔ "type": "module" aggiunto in package.json`);
    }

    tree.overwrite(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  };
}
