import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function cleanAppHtml(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Angular 21+ usa app.html, versioni precedenti usano app.component.html
    const candidates = ['src/app/app.html', 'src/app/app.component.html'];
    for (const path of candidates) {
      if (tree.exists(path)) {
        tree.overwrite(path, '<router-outlet />\n');
        context.logger.info(`  ✔ Ripulito ${path} con <router-outlet />`);
        return;
      }
    }
  };
}
