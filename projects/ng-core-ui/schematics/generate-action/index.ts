import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Schema } from './types';

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function toUpperSnakeCase(kebab: string): string {
  return kebab.replace(/-/g, '_').toUpperCase();
}

export function generateAction(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('angular.json')) {
      throw new SchematicsException('angular.json non trovato. Eseguire dalla root del progetto Angular.');
    }

    const angularJson = JSON.parse(tree.read('angular.json')!.toString('utf-8'));
    const projectName: string =
      angularJson.defaultProject ?? Object.keys(angularJson.projects)[0];

    if (!projectName) {
      throw new SchematicsException('Impossibile determinare il nome del progetto Angular.');
    }

    const actionsPath = 'src/app/app.actions.config.ts';
    if (!tree.exists(actionsPath)) {
      throw new SchematicsException(`${actionsPath} non trovato. Verificare che ng-add sia stato eseguito.`);
    }

    const kebabId    = toKebabCase(options.id);
    const constName  = toUpperSnakeCase(kebabId);
    const actionId   = `cap:${projectName}:action:${kebabId}`;

    const constDecl  = `export const ${constName}: CoreAction = {\n  id: '${actionId}',\n  description: '${options.description}',\n};\n`;
    const arrayEntry = `  ${constName},`;

    const content = tree.read(actionsPath)!.toString('utf-8');

    // Inserisce la const prima dell'array e il riferimento dentro l'array
    let updated = content.replace(
      /^(export const APP_ACTIONS)/m,
      `${constDecl}\n$1`,
    );
    updated = updated.replace(/^];$/m, `${arrayEntry}\n];`);

    if (updated === content) {
      throw new SchematicsException(`Impossibile aggiornare APP_ACTIONS in ${actionsPath}.`);
    }

    tree.overwrite(actionsPath, updated);
    context.logger.info(`  ✔ Aggiunta const ${constName} e riferimento in APP_ACTIONS (${actionsPath})`);
  };
}
