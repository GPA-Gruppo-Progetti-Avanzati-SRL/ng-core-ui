import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { LIB } from '../constants';
import { Schema } from '../types';

function buildActionsConfig(appId: string): string {
  return `import type { CoreAction } from '${LIB}';

export const APP_ACTIONS: CoreAction[] = [
  // Aggiungi qui le azioni della tua applicazione, es:
  // {
  //   id: 'cap:${appId}:action:save',
  //   description: 'Salva',
  // },
];
`;
}

export function createAppActionsConfig(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const angularJson = JSON.parse(tree.read('angular.json')!.toString('utf-8'));
    const projectName: string =
      options.project ?? angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];

    if (!projectName) {
      throw new SchematicsException('Impossibile determinare il nome del progetto Angular.');
    }

    const path = 'src/app/app.actions.config.ts';
    if (!tree.exists(path)) {
      tree.create(path, buildActionsConfig(projectName));
      context.logger.info('  ✔ Creato src/app/app.actions.config.ts');
    } else {
      context.logger.info('  ✔ app.actions.config.ts già presente');
    }
  };
}
