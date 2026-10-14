import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

// Path relativo a src/tailwind-app.css
const BRIDGE_PATH = `../node_modules/${LIB}/styles/mat-theme-bridge.css`;

// Pure CSS file — not SCSS — so PostCSS processes it directly without Sass interception.
// @import "tailwindcss/theme" provides the default spacing/sizing scale (--spacing, etc.)
// without preflight, which is already handled by components.css (pre-built library CSS).
// @import "tailwindcss/utilities" generates the utilities layer scanned from @source.
// mat-theme-bridge.css overrides the default Tailwind color tokens with --mat-sys-* variables.
// @custom-variant ui activates Tailwind utilities when inside a .ui ancestor (set on <body>).
const TAILWIND_APP_CSS = `@import "tailwindcss/theme";
@import "tailwindcss/utilities";
@import "${BRIDGE_PATH}";
@custom-variant ui (.ui &);
@source ".";
`;

export function createTailwindAppCss(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const cssPath = 'src/tailwind-app.css';
    if (tree.exists(cssPath)) {
      context.logger.info('  ✔ src/tailwind-app.css già presente');
    } else {
      tree.create(cssPath, TAILWIND_APP_CSS);
      context.logger.info('  ✔ Creato src/tailwind-app.css');
    }

    // Aggiunge class="ui" al <body> di index.html per attivare le utility Tailwind
    // sia dal components.css pre-compilato (.ui .flex) che dal variant ui: (ui:flex).
    const indexPath = 'src/index.html';
    if (tree.exists(indexPath)) {
      const content = tree.read(indexPath)!.toString('utf-8');
      const result = addBodyClass(content, 'ui');
      if (result === null) {
        context.logger.warn('  ⚠ <body> non trovato in src/index.html — aggiungere a mano class="ui"');
      } else if (result !== content) {
        tree.overwrite(indexPath, result);
        context.logger.info('  ✔ Aggiunto class="ui" al <body> di src/index.html');
      }
    }
  };
}

/**
 * Aggiunge `cls` alle classi del primo `<body …>` conservando quelle esistenti
 * (es. `mat-typography` messo da `ng add @angular/material`). Ritorna il contenuto invariato se la
 * classe c'è già, `null` se non trova il tag.
 */
export function addBodyClass(html: string, cls: string): string | null {
  const body = /<body\b([^>]*)>/i.exec(html);
  if (!body) return null;
  const attrs = body[1];
  const classAttr = /\sclass\s*=\s*(["'])(.*?)\1/i.exec(attrs);
  let newAttrs: string;
  if (classAttr) {
    const classes = classAttr[2].split(/\s+/).filter(Boolean);
    if (classes.includes(cls)) return html;
    const q = classAttr[1];
    newAttrs = attrs.replace(classAttr[0], ` class=${q}${[...classes, cls].join(' ')}${q}`);
  } else {
    newAttrs = ` class="${cls}"${attrs}`;
  }
  return html.slice(0, body.index) + `<body${newAttrs}>` + html.slice(body.index + body[0].length);
}
