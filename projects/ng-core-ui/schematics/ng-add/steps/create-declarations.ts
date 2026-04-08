import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

export function createDeclarations(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const declPath = 'src/declarations.d.ts';
    if (!tree.exists(declPath)) {
      tree.create(declPath, `// Costanti iniettate dal build system tramite esbuild --define
declare const AppSha: string;
declare const AppVersion: string;
`);
      context.logger.info('  ✔ Creato src/declarations.d.ts');
    }
  };
}
