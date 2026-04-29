/**
 * Genera acl.mongo.js (replaceOne upsert per cap_defs + cap_group) per il seeding MongoDB.
 * Usage (from the consuming app root):
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-mongo.mjs
 *
 * Reads APP_ROUTES (and optionally APP_ACTIONS) from the consuming app's
 * src/app/app.routes.config.ts and writes dist/caps/ui/acl.mongo.js.
 */
import { toRoutesMongo } from '../src/lib/system/routes-export';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const appRoot = process.cwd();

const angularJson = JSON.parse(readFileSync(join(appRoot, 'angular.json'), 'utf-8'));
const appId: string = angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];

const packageJson = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf-8'));
const appDescription: string = packageJson.description ?? '';

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
writeFileSync(join(outDir, 'acl.mongo.js'), toRoutesMongo(APP_ROUTES, APP_ACTIONS, appId, appDescription));
console.log('acl.mongo.js written to', join(outDir, 'acl.mongo.js'));
