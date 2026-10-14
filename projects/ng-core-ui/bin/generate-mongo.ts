/**
 * Genera acl.mongo.js (replaceOne upsert per cap_defs + cap_group) per il seeding MongoDB.
 * Usage (from the consuming app root):
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-mongo.mjs [--app-id=<id>]
 *
 * Reads APP_ROUTES (and optionally APP_ACTIONS) from the consuming app's
 * src/app/app.routes.config.ts and writes dist/caps/ui/acl.mongo.js.
 */
import { toRoutesMongo } from '../src/lib/system/routes-export';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadAclInput } from './acl-input';

const { appRoot, appId, appDescription, routes, actions } = await loadAclInput();

const outDir = join(appRoot, 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'acl.mongo.js'), toRoutesMongo(routes, actions, appId, appDescription));
console.log('acl.mongo.js written to', join(outDir, 'acl.mongo.js'));
