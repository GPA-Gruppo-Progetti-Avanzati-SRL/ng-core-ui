import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

const HOME_COMPONENT_TS = `import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import {
  CardComponent,
  PageHeaderComponent,
  SystemService,
} from '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

@Component({
  selector: 'app-home',
  imports: [CardComponent, PageHeaderComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly system = inject(SystemService);
  readonly menu = computed(() => (this.system.menuTreeSig() ?? []).filter(p => p.path !== '/'));
  readonly homeTitle = computed(() => this.system.getEnvironmentProperty('homeTitle') as string);
  readonly homeSubTitle = computed(
    () => this.system.getEnvironmentProperty('homeSubTitle') as string,
  );
  navigate(path: string): void {
    if (path) window.location.href = path;
  }
}
`;

const HOME_COMPONENT_HTML = `<core-page-header [title]="homeTitle()" [subtitle]="homeSubTitle()" />
<div class="ui:flex ui:flex-wrap ui:gap-6 ui:justify-start ui:pl-8 ui:pt-4">
  @for (path of menu(); track path.id) {
    <core-card
      [title]="path.description || path.id"
      [icon]="path.icon || 'language'"
      [subtitle]="path.description || path.id"
      buttonLabel="Procedi"
      (buttonClick)="navigate(path.path!)"
    />
  }
  @empty {
    <p class="ui:text-on-surface-variant ui:text-center ui:p-8">Nessun sito disponibile.</p>
  }
</div>
`;

export function createHomeComponent(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const tsPath   = 'src/app/pages/home/home.component.ts';
    const htmlPath = 'src/app/pages/home/home.component.html';

    if (tree.exists(tsPath)) {
      context.logger.info('  ✔ HomeComponent già presente');
      return;
    }

    tree.create(tsPath, HOME_COMPONENT_TS);
    tree.create(htmlPath, HOME_COMPONENT_HTML);
    context.logger.info('  ✔ Creato src/app/pages/home/home.component.ts');
    context.logger.info('  ✔ Creato src/app/pages/home/home.component.html');
  };
}
