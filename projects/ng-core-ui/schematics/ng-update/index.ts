import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LIB_TARGET_VERSIONS: Record<string, string> =
  (require('../../package.json') as { 'ng-add'?: { targetVersions?: Record<string, string> } })['ng-add']?.targetVersions ?? {};

const BUILD_TOOLS = new Set(['@angular/build', '@angular/cli', '@angular/compiler-cli']);

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

    const angularVersion = LIB_TARGET_VERSIONS['@angular/core'] ?? '^21.0.0';
    const majorMatch = angularVersion.match(/\d+/);
    const angularMajorVersion = majorMatch ? `^${majorMatch[0]}.0.0` : angularVersion;

    let changed = false;

    // Aggiorna tutti i pacchetti @angular/* presenti
    for (const section of [deps, devDeps]) {
      for (const pkg of Object.keys(section)) {
        if (pkg.startsWith('@angular/')) {
          const target = LIB_TARGET_VERSIONS[pkg] ?? (BUILD_TOOLS.has(pkg) ? angularMajorVersion : angularVersion);
          if (section[pkg] !== target) {
            context.logger.info(`  ✔ Aggiornato ${pkg}: ${section[pkg]} → ${target}`);
            section[pkg] = target;
            changed = true;
          }
        }
      }
    }

    // Aggiorna o aggiunge le dipendenze non-Angular (tailwindcss, postcss, typescript…)
    const nonAngular = Object.entries(LIB_TARGET_VERSIONS).filter(([pkg]) => !pkg.startsWith('@angular/'));
    for (const [pkg, version] of nonAngular) {
      if (deps[pkg] && deps[pkg] !== version) {
        context.logger.info(`  ✔ Aggiornato ${pkg}: ${deps[pkg]} → ${version}`);
        deps[pkg] = version;
        changed = true;
      } else if (devDeps[pkg] && devDeps[pkg] !== version) {
        context.logger.info(`  ✔ Aggiornato ${pkg}: ${devDeps[pkg]} → ${version}`);
        devDeps[pkg] = version;
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
