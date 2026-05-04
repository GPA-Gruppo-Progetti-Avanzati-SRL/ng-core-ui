import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const libPkg = require('../../package.json') as { version: string; 'ng-add'?: { targetVersions?: Record<string, string> } };
const LIB = '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';
const LIB_VERSION: string = libPkg.version;
const LIB_TARGET_VERSIONS: Record<string, string> = libPkg['ng-add']?.targetVersions ?? {};

const BUILD_TOOLS = new Set(['@angular/build', '@angular/cli', '@angular/compiler-cli']);

function exact(v: string): string {
  return v.replace(/^[^0-9]*/, '');
}

export function ngUpdate(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('');
    context.logger.info('🔄 Aggiornamento dipendenze ng-core-ui...');

    if (!tree.exists('package.json')) {
      throw new SchematicsException('package.json non trovato.');
    }

    const pkgJson = JSON.parse(tree.read('package.json')!.toString('utf-8'));
    const deps: Record<string, string> = pkgJson.dependencies ?? {};
    const devDeps: Record<string, string> = pkgJson.devDependencies ?? {};

    const angularVersion = exact(LIB_TARGET_VERSIONS['@angular/core'] ?? '21.0.0');
    const majorMatch = angularVersion.match(/\d+/);
    const angularMajorVersion = majorMatch ? `^${majorMatch[0]}.0.0` : angularVersion;

    let changed = false;

    // Pinna la libreria stessa alla versione esatta
    if (deps[LIB] && deps[LIB] !== LIB_VERSION) {
      context.logger.info(`  ✔ Aggiornato ${LIB}: ${deps[LIB]} → ${LIB_VERSION}`);
      deps[LIB] = LIB_VERSION;
      changed = true;
    }

    // Aggiorna tutti i pacchetti @angular/* presenti
    for (const section of [deps, devDeps]) {
      for (const pkg of Object.keys(section)) {
        if (pkg.startsWith('@angular/')) {
          const target = BUILD_TOOLS.has(pkg)
            ? angularMajorVersion
            : exact(LIB_TARGET_VERSIONS[pkg] ?? angularVersion);
          if (section[pkg] !== target) {
            context.logger.info(`  ✔ Aggiornato ${pkg}: ${section[pkg]} → ${target}`);
            section[pkg] = target;
            changed = true;
          }
        }
      }
    }

    // Aggiorna le dipendenze non-Angular (tailwindcss, postcss, typescript…)
    const nonAngular = Object.entries(LIB_TARGET_VERSIONS).filter(([pkg]) => !pkg.startsWith('@angular/'));
    for (const [pkg, version] of nonAngular) {
      const target = exact(version);
      if (deps[pkg] && deps[pkg] !== target) {
        context.logger.info(`  ✔ Aggiornato ${pkg}: ${deps[pkg]} → ${target}`);
        deps[pkg] = target;
        changed = true;
      } else if (devDeps[pkg] && devDeps[pkg] !== target) {
        context.logger.info(`  ✔ Aggiornato ${pkg}: ${devDeps[pkg]} → ${target}`);
        devDeps[pkg] = target;
        changed = true;
      }
    }

    if (changed) {
      pkgJson.dependencies = deps;
      pkgJson.devDependencies = devDeps;
      tree.overwrite('package.json', JSON.stringify(pkgJson, null, 2) + '\n');
      context.addTask(new NodePackageInstallTask());
      context.logger.info('  ✔ Dipendenze aggiornate, install schedulato');
    } else {
      context.logger.info('  ✔ Dipendenze già aggiornate');
    }
  };
}
