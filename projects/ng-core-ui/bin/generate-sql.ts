/**
 * Genera acl.sql per il seeding SQL delle tabelle ACL.
 * Usage (from the consuming app root):
 *   node node_modules/@gpa-gruppo-progetti-avanzati-srl/ng-core-ui/bin/generate-sql.mjs [--app-id=<id>]
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
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadAclInput } from './acl-input';

const dialectArg = process.argv.find(a => a.startsWith('--dialect='));
const dialect = dialectArg?.split('=')[1] === 'oracle' ? 'oracle' : 'pg';

const { appRoot, appId, appDescription, routes, actions } = await loadAclInput();

const outDir = join(appRoot, 'dist', 'caps', 'ui');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'acl.sql'), toRoutesSql(routes, actions, appId, appDescription, dialect));
console.log(`acl.sql (dialect: ${dialect}) written to`, join(outDir, 'acl.sql'));
