import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

const HOME_COMPONENT_TS = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [MatIconModule],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
`;

function buildHomeHtml(appName: string): string {
  return `<div class="flex items-center justify-center min-h-[70vh]">
  <div class="flex flex-col items-center gap-4 bg-surface border border-outline-variant p-8 py-6 rounded-xl shadow-lg">
    <mat-icon aria-hidden="true" class="text-[64px]! text-primary mb-2">home</mat-icon>
    <h1 class="text-[2.2rem] font-bold text-on-surface m-0">Benvenuto!</h1>
    <p class="text-[1.1rem] text-on-surface-variant text-center m-0">
      Questa è la home page di <strong>${appName}</strong>.<br />Seleziona una funzionalità dal menu laterale.
    </p>
  </div>
</div>
`;
}

export function createHomeComponent(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const tsPath   = 'src/app/pages/home/home.component.ts';
    const htmlPath = 'src/app/pages/home/home.component.html';

    if (tree.exists(tsPath)) {
      context.logger.info('  ✔ HomeComponent già presente');
      return;
    }

    // Legge il nome del progetto da package.json per personalizzare il testo
    let appName = 'App';
    if (tree.exists('package.json')) {
      const pkg = JSON.parse(tree.read('package.json')!.toString('utf-8'));
      if (pkg.name) {
        appName = pkg.name
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }

    tree.create(tsPath, HOME_COMPONENT_TS);
    tree.create(htmlPath, buildHomeHtml(appName));
    context.logger.info('  ✔ Creato src/app/pages/home/home.component.ts');
    context.logger.info('  ✔ Creato src/app/pages/home/home.component.html');
  };
}
