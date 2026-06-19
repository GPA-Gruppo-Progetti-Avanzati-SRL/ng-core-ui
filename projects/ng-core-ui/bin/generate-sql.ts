/**
 * Genera acl.sql per il seeding SQL delle tabelle ACL.
 * Usage (from the consuming app root):
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-sql.mjs
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-sql.mjs --dialect=oracle
 *
 * Reads APP_ROUTES (and optionally APP_ACTIONS) from the consuming app's
 * src/app/app.routes.config.ts and writes dist/caps/ui/acl.sql.
 *
 * Dialects:
 *   pg (default) — INSERT ... ON CONFLICT (PostgreSQL 9.5+)
 *   oracle       — MERGE INTO ... USING (SELECT ... FROM DUAL) (Oracle 9i+)
 *
 * Tables: opem_acl_cap_def, opem_acl_cap_group, opem_acl_cap_group_def
 */
import { toRoutesSql } from '../src/lib/system/routes-export';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

const appRoot = process.cwd();

const dialectArg = process.argv.find(a => a.startsWith('--dialect='));
const dialect = dialectArg?.split('=')[1] === 'oracle' ? 'oracle' : 'pg';

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
writeFileSync(join(outDir, 'acl.sql'), toRoutesSql(APP_ROUTES, APP_ACTIONS, appId, appDescription, dialect));
console.log(`acl.sql (dialect: ${dialect}) written to`, join(outDir, 'acl.sql'));