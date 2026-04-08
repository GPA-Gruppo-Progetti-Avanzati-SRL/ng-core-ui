import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';

// Tailwind è ora gestito da src/tailwind-app.css (puro CSS → PostCSS, solo @utilities).
// styles.scss rimane per stili globali SCSS dell'app.
// Questo step rimuove eventuali direttive Tailwind aggiunte da versioni precedenti dello schematic.

export function updateStylesScss(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const stylesPath = 'src/styles.scss';
    if (!tree.exists(stylesPath)) {
      tree.create(stylesPath, '/* Global app styles */\n');
      context.logger.info('  ✔ Creato src/styles.scss');
      return;
    }

    let content = tree.read(stylesPath)!.toString('utf-8');
    let changed = false;

    // Rimuove direttive Tailwind legacy (aggiunte da versioni precedenti dello schematic)
    const legacyPatterns = [
      /\n?@use "tailwindcss";\n?/g,
      /\n?@use 'tailwindcss';\n?/g,
      /\n?@config "[^"]+tailwind\.config\.js";\n?/g,
      /\n?@config '[^']+tailwind\.config\.js';\n?/g,
      new RegExp(`\n?@source "${LIB}/src";\n?`, 'g'),
      new RegExp(`\n?@source '${LIB}/src';\n?`, 'g'),
      new RegExp(`\n?@source "${LIB}";\n?`, 'g'),
      new RegExp(`\n?@source '${LIB}';\n?`, 'g'),
      /\n?@source "\.";\n?/g,
      /\n?@source '\.';\n?/g,
    ];

    for (const pattern of legacyPatterns) {
      const newContent = content.replace(pattern, '\n');
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    }

    if (changed) {
      tree.overwrite(stylesPath, content.trimStart());
      context.logger.info('  ✔ Rimosso Tailwind legacy da src/styles.scss (ora gestito da tailwind-app.css)');
    } else {
      context.logger.info('  ✔ src/styles.scss già pulito');
    }
  };
}
