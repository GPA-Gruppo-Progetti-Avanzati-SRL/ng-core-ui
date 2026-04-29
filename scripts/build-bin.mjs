/**
 * Bundles projects/ng-core-ui/bin/generate-acl.ts
 * into a self-contained ESM script at projects/ng-core-ui/bin/generate-acl.mjs.
 *
 * The output imports only Node built-ins (fs, path) — zero runtime deps —
 * so consuming apps can run it with `bun` or `node --input-type=module`.
 */
import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const libDir = resolve(__dirname, '../projects/ng-core-ui');

await build({
  entryPoints: [resolve(libDir, 'bin/generate-acl.ts')],
  outfile: resolve(libDir, 'bin/generate-acl.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  // Keep dynamic import() calls intact — at runtime they resolve against
  // the consuming app's file system (import(routesConfigPath)).
  external: ['fs', 'path'],
  // Do NOT bundle the dynamic imports (app-specific routes/actions files).
  // esbuild can't resolve them at build time anyway since they're runtime paths.
  banner: {
    js: '// @gpa-gruppo-progetti-avanzati-srl/ng-core-ui — generate-acl\n// Run from the consuming app root: node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-acl.mjs\n// Output: dist/caps/ui/routes.yaml',
  },
});

console.log('✔ Built projects/ng-core-ui/bin/generate-acl.mjs');
