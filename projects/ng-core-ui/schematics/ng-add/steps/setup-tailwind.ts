import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function setupTailwind(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('.postcssrc.json')) {
      tree.create('.postcssrc.json', JSON.stringify({ plugins: { '@tailwindcss/postcss': {} } }, null, 2) + '\n');
      context.logger.info('  ✔ Creato .postcssrc.json');
    }
  };
}
