import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { LIB_TARGET_VERSIONS } from '../constants';

export function alignDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('package.json')) {
      throw new SchematicsException('package.json non trovato.');
    }

    const pkgJson = JSON.parse(tree.read('package.json')!.toString('utf-8'));
    const deps: Record<string, string> = pkgJson.dependencies ?? {};
    const devDeps: Record<string, string> = pkgJson.devDependencies ?? {};

    const angularVersion = LIB_TARGET_VERSIONS['@angular/core'] ?? '^21.0.0';
    // I build tool (@angular/build, @angular/cli, @angular/compiler-cli) seguono
    // un versioning proprio: usare solo il major evita errori "version not found"
    const majorMatch = angularVersion.match(/\d+/);
    const angularMajorVersion = majorMatch ? `^${majorMatch[0]}.0.0` : angularVersion;
    const BUILD_TOOLS = new Set(['@angular/build', '@angular/cli', '@angular/compiler-cli']);
    let changed = false;

    // Aggiorna tutti i pacchetti @angular/* già presenti (sia deps che devDeps)
    // Priorità: versione specifica in peerDeps > major per build tool > versione core
    for (const section of [deps, devDeps]) {
      for (const pkg of Object.keys(section)) {
        if (pkg.startsWith('@angular/')) {
          const target = LIB_TARGET_VERSIONS[pkg] ?? (BUILD_TOOLS.has(pkg) ? angularMajorVersion : angularVersion);
          if (section[pkg] !== target) {
            context.logger.info(`  ✔ Allineato ${pkg}: ${section[pkg]} → ${target}`);
            section[pkg] = target;
            changed = true;
          }
        }
      }
    }

    // Aggiunge pacchetti Angular mancanti
    const angularExtras = ['@angular/animations', '@angular/material'];
    for (const pkg of angularExtras) {
      if (!deps[pkg] && !devDeps[pkg]) {
        const target = LIB_TARGET_VERSIONS[pkg] ?? angularVersion;
        deps[pkg] = target;
        context.logger.info(`  ✔ Aggiunta dipendenza: ${pkg}@${target}`);
        changed = true;
      }
    }

    // Aggiorna o aggiunge le peerDependencies non-Angular (tailwindcss, postcss, typescript…)
    const nonAngularPeers = Object.entries(LIB_TARGET_VERSIONS).filter(([pkg]) => !pkg.startsWith('@angular/'));
    for (const [pkg, version] of nonAngularPeers) {
      if (deps[pkg] && deps[pkg] !== version) {
        context.logger.info(`  ✔ Allineato ${pkg}: ${deps[pkg]} → ${version}`);
        deps[pkg] = version;
        changed = true;
      } else if (devDeps[pkg] && devDeps[pkg] !== version) {
        context.logger.info(`  ✔ Allineato ${pkg}: ${devDeps[pkg]} → ${version}`);
        devDeps[pkg] = version;
        changed = true;
      } else if (!deps[pkg] && !devDeps[pkg]) {
        deps[pkg] = version;
        context.logger.info(`  ✔ Aggiunta dipendenza: ${pkg}@${version}`);
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
      context.logger.info('  ✔ Dipendenze già allineate');
    }
  };
}
