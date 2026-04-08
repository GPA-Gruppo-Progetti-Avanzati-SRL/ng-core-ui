import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

const STYLES_TEMPLATE = `@use "tailwindcss";
@source "${LIB}";
`;

export function updateStylesScss(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const stylesPath = 'src/styles.scss';
    if (!tree.exists(stylesPath)) {
      tree.create(stylesPath, STYLES_TEMPLATE);
      context.logger.info('  ✔ Creato src/styles.scss');
      return;
    }

    let content = tree.read(stylesPath)!.toString('utf-8');
    let changed = false;

    if (!content.includes('@use "tailwindcss"') && !content.includes("@use 'tailwindcss'")) {
      content += `\n@use "tailwindcss";\n`;
      changed = true;
    }

    if (!content.includes(`@source "${LIB}"`) && !content.includes(`@source '${LIB}'`)) {
      content += `@source "${LIB}";\n`;
      changed = true;
    }

    if (changed) {
      tree.overwrite(stylesPath, content);
      context.logger.info('  ✔ Aggiornato src/styles.scss con Tailwind e @source ng-core-ui');
    } else {
      context.logger.info('  ✔ src/styles.scss già configurato');
    }
  };
}
