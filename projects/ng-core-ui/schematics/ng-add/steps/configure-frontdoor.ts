import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Schema } from '../types';

export const FRONTDOOR_BASE_HREF        = '/__appType__/__domainId__/__siteId__/__siteScope__/__language__/__appId__/';
export const FRONTDOOR_TOKEN_URL        = '/api/core/acl';
export const FRONTDOOR_ENVIRONMENT_URL  = '/api/core/environment';
export const FRONTDOOR_DEPLOY_URL       = '__static_path_to_webapps__/__appName__/__appVersion__/';

export function configureFrontdoor(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!options.frontdoor) {
      context.logger.info('  ✔ Front Door non abilitato, skip');
      return;
    }

    const angularJsonPath = 'angular.json';
    if (!tree.exists(angularJsonPath)) {
      throw new SchematicsException('angular.json non trovato.');
    }

    const angularJson = JSON.parse(tree.read(angularJsonPath)!.toString('utf-8'));
    const projectName = options.project ?? angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];
    const project = angularJson.projects[projectName];

    if (!project) {
      throw new SchematicsException(`Progetto "${projectName}" non trovato in angular.json.`);
    }

    const buildOptions = project.architect?.build?.options;
    if (buildOptions) {
      const deployUrl = options.deployUrl?.trim() || FRONTDOOR_DEPLOY_URL;
      if (!buildOptions.deployUrl) {
        buildOptions.deployUrl = deployUrl;
        context.logger.info(`  ✔ [Front Door] Impostato deployUrl: ${deployUrl}`);
      }
    }

    tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');
    context.logger.info('  ✔ [Front Door] Configurazione angular.json completata');
  };
}
