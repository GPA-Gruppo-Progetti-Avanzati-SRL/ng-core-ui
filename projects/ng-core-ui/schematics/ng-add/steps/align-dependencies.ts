import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { LIB, LIB_TARGET_VERSIONS } from '../constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const LIB_VERSION: string = (require('../../../package.json') as { version: string }).version;

/** Rimuove prefissi semver (^, ~, >=, <=, >, <) per forzare versione esatta. */
function exact(v: string): string {
  return v.replace(/^[^0-9]*/, '');
}

/** Ritorna true se la versione a (con o senza prefisso) è >= b (stringa semver pulita). */
function semverGte(a: string, b: string): boolean {
  const parse = (v: string): [number, number, number] => {
    const parts = exact(v).split('.').map(n => parseInt(n ?? '0', 10));
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const [amaj, amin, apatch] = parse(a);
  const [bmaj, bmin, bpatch] = parse(b);
  if (amaj !== bmaj) return amaj > bmaj;
  if (amin !== bmin) return amin > bmin;
  return apatch >= bpatch;
}

export function alignDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (!tree.exists('package.json')) {
      throw new SchematicsException('package.json non trovato.');
    }

    const pkgJson = JSON.parse(tree.read('package.json')!.toString('utf-8'));
    const deps: Record<string, string> = pkgJson.dependencies ?? {};
    const devDeps: Record<string, string> = pkgJson.devDependencies ?? {};

    const angularVersion = exact(LIB_TARGET_VERSIONS['@angular/core'] ?? '21.0.0');
    // I build tool (@angular/build, @angular/cli, @angular/compiler-cli) seguono
    // un versioning proprio: usare solo il major evita errori "version not found"
    const majorMatch = angularVersion.match(/\d+/);
    const angularMajorVersion = majorMatch ? `^${majorMatch[0]}.0.0` : angularVersion;
    const BUILD_TOOLS = new Set(['@angular/build', '@angular/cli', '@angular/compiler-cli']);
    let changed = false;

    // Pinna la libreria stessa alla versione esatta
    if (deps[LIB] && deps[LIB] !== LIB_VERSION) {
      context.logger.info(`  ✔ Pinnato ${LIB}: ${deps[LIB]} → ${LIB_VERSION}`);
      deps[LIB] = LIB_VERSION;
      changed = true;
    }

    // Aggiorna i pacchetti @angular/* già presenti.
    // Build tool → ^major.0.0 (versioning indipendente da Angular core).
    // Altri → aggiorna solo se la versione corrente è più vecchia del target:
    //   evita downgrade (es. 21.2.11 → 21.2.10) che causano ERESOLVE per le
    //   peer dep esatte tra pacchetti Angular.
    for (const section of [deps, devDeps]) {
      for (const pkg of Object.keys(section)) {
        if (pkg.startsWith('@angular/')) {
          if (BUILD_TOOLS.has(pkg)) {
            if (section[pkg] !== angularMajorVersion) {
              context.logger.info(`  ✔ Allineato ${pkg}: ${section[pkg]} → ${angularMajorVersion}`);
              section[pkg] = angularMajorVersion;
              changed = true;
            }
          } else {
            const pkgTarget = LIB_TARGET_VERSIONS[pkg] ?? angularVersion;
            if (!semverGte(section[pkg], pkgTarget)) {
              const target = `^${exact(pkgTarget)}`;
              context.logger.info(`  ✔ Allineato ${pkg}: ${section[pkg]} → ${target}`);
              section[pkg] = target;
              changed = true;
            }
          }
        }
      }
    }

    // Aggiunge pacchetti Angular mancanti.
    // - Pacchetti con versione propria in LIB_TARGET_VERSIONS (es. @angular/material,
    //   che può avere patch più basse di @angular/core): usa ^targetVersion specifica.
    // - Pacchetti senza entry specifica (es. @angular/animations, rilasciato in sincronia
    //   con core): usa la stessa versione di @angular/core già presente nel progetto,
    //   così npm non installa versioni miste e non crea duplicati di @angular/core.
    const resolvedCoreVersion = deps['@angular/core'] || devDeps['@angular/core'];
    const angularExtras = ['@angular/animations', '@angular/material'];
    for (const pkg of angularExtras) {
      if (!deps[pkg] && !devDeps[pkg]) {
        const target = LIB_TARGET_VERSIONS[pkg]
          ? `^${exact(LIB_TARGET_VERSIONS[pkg])}`
          : (resolvedCoreVersion ?? `^${angularVersion}`);
        deps[pkg] = target;
        context.logger.info(`  ✔ Aggiunta dipendenza: ${pkg}@${target}`);
        changed = true;
      }
    }

    // Aggiorna o aggiunge le peerDependencies non-Angular (tailwindcss, postcss, typescript…)
    const nonAngularPeers = Object.entries(LIB_TARGET_VERSIONS).filter(([pkg]) => !pkg.startsWith('@angular/'));
    for (const [pkg, version] of nonAngularPeers) {
      const target = exact(version);
      if (deps[pkg] && deps[pkg] !== target) {
        context.logger.info(`  ✔ Allineato ${pkg}: ${deps[pkg]} → ${target}`);
        deps[pkg] = target;
        changed = true;
      } else if (devDeps[pkg] && devDeps[pkg] !== target) {
        context.logger.info(`  ✔ Allineato ${pkg}: ${devDeps[pkg]} → ${target}`);
        devDeps[pkg] = target;
        changed = true;
      } else if (!deps[pkg] && !devDeps[pkg]) {
        deps[pkg] = target;
        context.logger.info(`  ✔ Aggiunta dipendenza: ${pkg}@${target}`);
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
