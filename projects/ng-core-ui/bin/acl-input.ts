/**
 * Input comune dei generatori ACL (generate-acl/mongo/sql): legge APP_ROUTES, APP_ACTIONS,
 * appId e descrizione dall'app consumatrice (cwd). Bundlato da esbuild in ciascun .mjs.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { CoreAction, CoreRouteBase } from '../src/lib/system/routes-export';

export interface AclInput {
  appRoot: string;
  appId: string;
  appDescription: string;
  routes: CoreRouteBase[];
  actions: CoreAction[] | undefined;
}

function argValue(name: string): string | undefined {
  return process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
}

export async function loadAclInput(): Promise<AclInput> {
  const appRoot = process.cwd();

  // appId: --app-id=<id> se l'app a runtime usa un environment.appId diverso dal nome progetto
  const angularJson = JSON.parse(readFileSync(join(appRoot, 'angular.json'), 'utf-8'));
  const projectName: string = angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];
  const appId = argValue('app-id') ?? projectName;
  if (appId !== projectName) console.log(`appId: ${appId} (da --app-id, progetto angular.json: ${projectName})`);

  const packageJson = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf-8'));
  const appDescription: string = packageJson.description ?? '';

  // pathToFileURL è necessario su Windows: import() non accetta path con backslash
  const routesFile = join(appRoot, 'src/app/app.routes.config.ts');
  const { APP_ROUTES } = await import(pathToFileURL(routesFile).href);

  // APP_ACTIONS è opzionale: si salta solo se il file non esiste. Un errore dentro il file
  // (sintassi, import rotto) deve fermare la generazione, non produrre un'ACL senza action.
  const actionsFile = join(appRoot, 'src/app/app.actions.config.ts');
  let actions: CoreAction[] | undefined;
  if (existsSync(actionsFile)) {
    actions = (await import(pathToFileURL(actionsFile).href)).APP_ACTIONS;
    if (!Array.isArray(actions)) {
      throw new Error(`${actionsFile} esiste ma non esporta un array APP_ACTIONS`);
    }
  }

  return { appRoot, appId, appDescription, routes: APP_ROUTES, actions };
}
