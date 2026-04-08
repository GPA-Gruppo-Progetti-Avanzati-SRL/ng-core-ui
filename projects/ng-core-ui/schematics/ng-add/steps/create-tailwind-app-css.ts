import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

// Path relativo a src/tailwind-app.css → node_modules/ è un livello sopra
const CONFIG_PATH = `../node_modules/${LIB}/tailwind.config.js`;

// Pure CSS file — not SCSS — so PostCSS processes it directly without Sass interception.
// @import "tailwindcss/utilities" generates ONLY the utilities layer;
// base and theme come from components.css (pre-built library CSS), avoiding duplication.
const TAILWIND_APP_CSS = `@import "tailwindcss/utilities";
@config "${CONFIG_PATH}";
@source ".";
`;

export function createTailwindAppCss(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = 'src/tailwind-app.css';
    if (tree.exists(path)) {
      context.logger.info('  ✔ src/tailwind-app.css già presente');
      return;
    }
    tree.create(path, TAILWIND_APP_CSS);
    context.logger.info('  ✔ Creato src/tailwind-app.css');
  };
}
