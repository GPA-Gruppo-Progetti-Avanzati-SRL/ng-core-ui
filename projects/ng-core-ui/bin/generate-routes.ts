/**
 * Generate routes.yaml for backend permission seeding.
 * Usage (from the consuming app root):
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-routes.mjs
 *
 * Reads APP_ROUTES (and optionally APP_ACTIONS) from the consuming app's
 * src/app/app.routes.config.ts and writes dist/caps/ui/routes.yaml.
 */
import { toRoutesYaml } from '../src/lib/system/routes-export';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';


const appRoot = process.cwd();

// pathToFileURL is required on Windows: import() does not accept backslash paths
// (e.g. C:\Users\...) — they must be converted to file:// URLs first.
const routesConfigPath = pathToFileURL(join(appRoot, 'src/app/app.routes.config.ts')).href;
const actionsConfigPath = pathToFileURL(join(appRoot, 'src/app/app.actions.config.ts')).href;

const { APP_ROUTES } = await import(routesConfigPath);

let APP_ACTIONS: { id: string; description?: string }[] | undefined;
try {
  const actionsModule = await import(actionsConfigPath);
  APP_ACTIONS = actionsModule.APP_ACTIONS;
} catch {
  // APP_ACTIONS is optional — no-op if file doesn't exist
}

const outDir = join(appRoot, 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'routes.yaml'), toRoutesYaml(APP_ROUTES, APP_ACTIONS));
console.log('routes.yaml written to', join(outDir, 'routes.yaml'));
