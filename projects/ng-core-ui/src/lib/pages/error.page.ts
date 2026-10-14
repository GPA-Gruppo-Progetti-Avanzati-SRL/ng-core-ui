import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { BUILD_INFO } from '../system/build-info';
import { CoreLabelsService } from '../system/labels.service';

/** Punti di estensione per i test (window.location.reload non è spiabile). */
export const _errorPageInternals = {
  reload: (): void => window.location.reload(),
};

/**
 * Pagina mostrata dai layout quando il bootstrap fallisce. "Riprova" ricarica la pagina allo
 * stesso URL (il guard non reindirizza più a /error, quindi l'URL richiesto è conservato).
 */
@Component({
  selector: 'core-error-page',
  imports: [MatIcon, MatButton],
  template: `
    <div role="alert" class="flex flex-col items-center justify-center h-screen gap-6 text-center bg-surface text-on-surface">
      <mat-icon aria-hidden="true" class="!text-[96px] !w-[96px] !h-[96px] opacity-30">cloud_off</mat-icon>
      <div>
        <p class="text-2xl font-semibold m-0">{{ t().errorPage.title }}</p>
        <p class="mt-2 m-0 opacity-60">{{ t().errorPage.message }}<br>{{ t().errorPage.contact }}</p>
      </div>
      <button mat-flat-button type="button" (click)="retry()">{{ t().errorPage.retry }}</button>
    </div>
    <div class="fixed bottom-2 right-4 text-[10px] text-error opacity-80 pointer-events-none z-[1000]">
      {{ t().layout.version }}: {{ appVersion }} - Sha: {{ appSha }}
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class ErrorPage {
  protected readonly t = inject(CoreLabelsService).labels;
  readonly appSha = BUILD_INFO.sha;
  readonly appVersion = BUILD_INFO.version;

  protected retry(): void {
    _errorPageInternals.reload();
  }
}
