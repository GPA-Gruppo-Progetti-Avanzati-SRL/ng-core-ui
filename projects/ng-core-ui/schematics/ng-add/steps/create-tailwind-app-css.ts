import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

// Paths relativi a src/tailwind-app.css
const CONFIG_PATH = `../node_modules/${LIB}/tailwind.config.js`;
const BRIDGE_PATH = `../node_modules/${LIB}/styles/mat-theme-bridge.css`;

// Pure CSS file — not SCSS — so PostCSS processes it directly without Sass interception.
// @import "tailwindcss/utilities" generates ONLY the utilities layer;
// base and theme come from components.css (pre-built library CSS), avoiding duplication.
// mat-theme-bridge.css bridges --mat-sys-* variables to Tailwind color tokens.
const TAILWIND_APP_CSS = `@import "tailwindcss/utilities";
@import "${BRIDGE_PATH}";
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
