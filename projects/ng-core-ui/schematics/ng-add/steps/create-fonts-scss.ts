import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

// I path puntano a node_modules/ relativamente a src/fonts.scss (un livello su).
// Angular li risolve a build-time, li include nel bundle e applica deployUrl se configurato.
const FONTS_SCSS = `// @font-face generato da ng-add di ${LIB}
// I path sono relativi a questo file (src/) → Angular li processa e applica deployUrl.

@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: url('../node_modules/${LIB}/assets/icons/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2') format('woff2');
}

/* roboto-300 */
@font-face {
  font-display: swap;
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 300;
  src: url('../node_modules/${LIB}/assets/fonts/roboto/roboto-v51-latin-300.woff2') format('woff2');
}

/* roboto-regular */
@font-face {
  font-display: swap;
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 400;
  src: url('../node_modules/${LIB}/assets/fonts/roboto/roboto-v51-latin-regular.woff2') format('woff2');
}

/* roboto-500 */
@font-face {
  font-display: swap;
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 500;
  src: url('../node_modules/${LIB}/assets/fonts/roboto/roboto-v51-latin-500.woff2') format('woff2');
}

/* roboto-600 */
@font-face {
  font-display: swap;
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 600;
  src: url('../node_modules/${LIB}/assets/fonts/roboto/roboto-v51-latin-600.woff2') format('woff2');
}
`;

export function createFontsScss(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const fontsPath = 'src/fonts.scss';
    if (!tree.exists(fontsPath)) {
      tree.create(fontsPath, FONTS_SCSS);
      context.logger.info('  ✔ Creato src/fonts.scss con @font-face relativi a node_modules');
    } else {
      context.logger.info('  ✔ src/fonts.scss già presente');
    }
  };
}
