import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';
import { FRONTDOOR_TOKEN_URL, FRONTDOOR_ENVIRONMENT_URL } from './configure-frontdoor';
import { Schema } from '../types';

function buildAppConfigContent(
  zoneless: boolean,
  browserErrors: boolean,
  tokenUrl: string,
  environmentUrl: string,
): string {
  const coreSymbols = ['ApplicationConfig'];
  const providers: string[] = [];

  if (browserErrors) {
    coreSymbols.push('provideBrowserGlobalErrorListeners');
    providers.push('provideBrowserGlobalErrorListeners()');
  }
  if (zoneless) {
    coreSymbols.push('provideZonelessChangeDetection');
    providers.push('provideZonelessChangeDetection()');
  }

  // Costruisce l'oggetto opzioni di provideGPAUICore solo con i valori custom
  const coreOpts: string[] = [];
  if (tokenUrl)       coreOpts.push(`tokenUrl: '${tokenUrl}'`);
  if (environmentUrl) coreOpts.push(`environmentUrl: '${environmentUrl}'`);
  const coreOptsStr = coreOpts.length ? `{ ${coreOpts.join(', ')} }` : '';

  providers.push(
    `provideRouter(toRoutes(APP_ROUTES))`,
    `provideHttpClient()`,
    `provideGPAUICore(${coreOptsStr})`,
  );

  return `import { ${coreSymbols.join(', ')} } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideGPAUICore, toRoutes } from '${LIB}';
import { APP_ROUTES } from './app.routes.config';

export const appConfig: ApplicationConfig = {
  providers: [
    ${providers.join(',\n    ')},
  ],
};
`;
}

export function updateAppConfig(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const configPath = 'src/app/app.config.ts';
    if (!tree.exists(configPath)) {
      context.logger.warn(`  ⚠ ${configPath} non trovato. Aggiungi manualmente provideGPAUICore() ai providers.`);
      return;
    }

    const content = tree.read(configPath)!.toString('utf-8');

    if (content.includes('provideGPAUICore')) {
      context.logger.info('  ✔ app.config.ts già configurato');
      return;
    }

    const hasZoneless      = content.includes('provideZonelessChangeDetection');
    const hasBrowserErrors = content.includes('provideBrowserGlobalErrorListeners');
    const tokenUrl         = options.tokenUrl?.trim()       || (options.frontdoor ? FRONTDOOR_TOKEN_URL       : '');
    const environmentUrl   = options.environmentUrl?.trim() || (options.frontdoor ? FRONTDOOR_ENVIRONMENT_URL : '');

    tree.overwrite(configPath, buildAppConfigContent(hasZoneless, hasBrowserErrors, tokenUrl, environmentUrl));
    context.logger.info('  ✔ Aggiornato app.config.ts');

    // Rimuovi app.routes.ts — sostituito da app.routes.config.ts
    if (tree.exists('src/app/app.routes.ts')) {
      tree.delete('src/app/app.routes.ts');
      context.logger.info('  ✔ Rimosso src/app/app.routes.ts (sostituito da app.routes.config.ts)');
    }
  };
}
