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

      // Ordine stili:
      //  1. src/fonts.scss        — @font-face via url() relativi a node_modules (deployUrl-aware)
      //  2. src/tailwind-app.css  — utilities Tailwind solo per l'app (puro CSS → PostCSS)
      //  3. components.css        — utilities Tailwind pre-buildate della libreria
      //  4. themes.scss           — tema Angular Material + override
      buildOptions.styles = buildOptions.styles ?? [];
      const themeEntry      = `node_modules/${LIB}/styles/themes.scss`;
      const componentsEntry = `node_modules/${LIB}/styles/components.css`;
      const tailwindAppEntry = 'src/tailwind-app.css';
      const fontsEntry      = 'src/fonts.scss';
      if (!buildOptions.styles.includes(themeEntry)) {
        buildOptions.styles.unshift(themeEntry);
        context.logger.info(`  ✔ Aggiunto ${themeEntry} agli stili`);
      }
      if (!buildOptions.styles.includes(componentsEntry)) {
        buildOptions.styles.unshift(componentsEntry);
        context.logger.info(`  ✔ Aggiunto ${componentsEntry} agli stili`);
      }
      if (!buildOptions.styles.includes(tailwindAppEntry)) {
        buildOptions.styles.unshift(tailwindAppEntry);
        context.logger.info(`  ✔ Aggiunto ${tailwindAppEntry} agli stili`);
      }
      if (!buildOptions.styles.includes(fontsEntry)) {
        buildOptions.styles.unshift(fontsEntry);
        context.logger.info(`  ✔ Aggiunto ${fontsEntry} agli stili`);
      }

      // Font e icone sono referenziati via url() in src/fonts.scss:
      // Angular li include nel bundle con hash e applica deployUrl automaticamente.
    }

    tree.overwrite(angularJsonPath, JSON.stringify(angularJson, null, 2) + '\n');
  };
}
