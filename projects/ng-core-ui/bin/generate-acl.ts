/**
 * Genera routes.yaml (cap_defs + cap_groups) per il seeding dei permessi nel backend.
 * Usage (from the consuming app root):
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-acl.mjs [--app-id=<id>]
 *
 * Reads APP_ROUTES (and optionally APP_ACTIONS) from the consuming app's
 * src/app/app.routes.config.ts and writes dist/caps/ui/routes.yaml.
 */
import { toRoutesYaml } from '../src/lib/system/routes-export';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadAclInput } from './acl-input';

const { appRoot, appId, appDescription, routes, actions } = await loadAclInput();

const outDir = join(appRoot, 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'routes.yaml'), toRoutesYaml(routes, actions, appId, appDescription));
console.log('routes.yaml written to', join(outDir, 'routes.yaml'));
