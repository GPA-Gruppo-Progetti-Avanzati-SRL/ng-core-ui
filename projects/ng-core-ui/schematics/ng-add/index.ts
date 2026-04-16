import { Rule, SchematicContext, Tree, chain } from '@angular-devkit/schematics';
import { Schema } from './types';
import { alignDependencies }          from './steps/align-dependencies';
import { setupTailwind }              from './steps/setup-tailwind';
import { updateAngularJson }          from './steps/update-angular-json';
import { configureFrontdoor }         from './steps/configure-frontdoor';
import { updateStylesScss }           from './steps/update-styles-scss';
import { createDeclarations }         from './steps/create-declarations';
import { updateAppConfig }            from './steps/update-app-config';
import { createRoutesConfig }         from './steps/create-routes-config';
import { createHomeComponent }        from './steps/create-home-component';
import { cleanAppHtml }               from './steps/clean-app-html';
import { createFontsScss }            from './steps/create-fonts-scss';
import { createTailwindAppCss }       from './steps/create-tailwind-app-css';
import { createGenerateRoutesScript } from './steps/create-generate-routes-script';
import { createDockerfile }           from './steps/create-dockerfile';

export function ngAdd(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('Configurazione ng-core-ui...');
    return chain([
      alignDependencies(),
      setupTailwind(),
      updateAngularJson(options),
      configureFrontdoor(options),
      updateStylesScss(),
      createDeclarations(),
      updateAppConfig(options),
      createRoutesConfig(options),
      createHomeComponent(),
      cleanAppHtml(),
      createFontsScss(),
      createTailwindAppCss(),
      createGenerateRoutesScript(),
      createDockerfile(options),
    ])(tree, context);
  };
}
