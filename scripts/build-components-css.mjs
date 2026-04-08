// Generates projects/ng-core-ui/styles/components.css
// by running PostCSS + Tailwind v4 over the library source files.
// Must run BEFORE ng-packagr so the CSS is picked up as an asset.

import postcss from 'postcss';
import tailwindPostcss from '@tailwindcss/postcss';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const libDir = resolve(__dirname, '../projects/ng-core-ui');

const inputPath = resolve(libDir, 'styles/components.input.css');
const outputPath = resolve(libDir, 'styles/components.css');

const css = readFileSync(inputPath, 'utf8');

const result = await postcss([tailwindPostcss()]).process(css, {
  from: inputPath,
  to: outputPath,
});

writeFileSync(outputPath, result.css);
console.log('✔ Built projects/ng-core-ui/styles/components.css');
