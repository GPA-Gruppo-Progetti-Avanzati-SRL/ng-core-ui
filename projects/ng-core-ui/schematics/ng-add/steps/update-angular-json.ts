import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';
import { FRONTDOOR_BASE_HREF } from './configure-frontdoor';
import { Schema } from '../types';

export function updateAngularJson(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
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

    // Base href + budget doppi in production config
    const productionConfig = project.architect?.build?.configurations?.production;
    if (productionConfig) {
      if (!productionConfig.baseHref) {
        const defaultBaseHref = options.frontdoor ? FRONTDOOR_BASE_HREF : '__BASE_HREF__';
        const baseHref = options.baseHref?.trim() || defaultBaseHref;
        productionConfig.baseHref = baseHref;
        context.logger.info(`  ✔ Impostato baseHref a ${baseHref} nella configurazione production`);
      }
      // Raddoppia le soglie di budget (default Angular: 500kB/1MB initial, 4kB/8kB component)
      productionConfig.budgets = [
        { type: 'initial',           maximumWarning: '1MB',  maximumError: '2MB' },
        { type: 'anyComponentStyle', maximumWarning: '8kB',  maximumError: '16kB' },
      ];
      context.logger.info('  ✔ Budget soglie raddoppiate (1MB/2MB initial, 8kB/16kB component)');
    }

    const buildOptions = project.architect?.build?.options;
    if (buildOptions) {
      // preserveSymlinks — necessario per librerie installate via link/file:
      if (!buildOptions.preserveSymlinks) {
        buildOptions.preserveSymlinks = true;
        context.logger.info('  ✔ Impostato preserveSymlinks: true');
      }

      // Stili
      buildOptions.styles = buildOptions.styles ?? [];
      const themeEntry = `node_modules/${LIB}/styles/themes.scss`;
      if (!buildOptions.styles.includes(themeEntry)) {
        buildOptions.styles.unshift(themeEntry);
        context.logger.info(`  ✔ Aggiunto ${themeEntry} agli stili`);
      }

      // Assets ng-core-ui
      buildOptions.assets = buildOptions.assets ?? [];
      const assetEntry = {
        glob: '**/*',
        input: `node_modules/${LIB}/assets`,
        output: 'assets/ng-core-ui',
      };
      const hasAsset = buildOptions.assets.some(
        (a: unknown) => typeof a === 'object' && (a as { input?: string }).input === assetEntry.input
      );
      if (!hasAsset) {
        buildOptions.assets.push(assetEntry);
        context.logger.info(`  ✔ Aggiunto asset mapping per ng-core-ui`);
      }
    }

    tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');
  };
}
