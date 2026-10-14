import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { CoreLabelsService } from '../system/labels.service';

@Component({
  selector: 'core-not-found-page',
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-semibold mb-2 text-on-surface">{{ t().notFound.title }}</h1>
      <p class="text-on-surface-variant">{{ t().notFound.message }}</p>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class NotFoundPage {
  protected readonly t = inject(CoreLabelsService).labels;
}
