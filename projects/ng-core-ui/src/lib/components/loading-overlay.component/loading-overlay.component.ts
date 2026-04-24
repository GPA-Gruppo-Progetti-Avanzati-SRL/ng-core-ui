import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../system/loading.service';

@Component({
  selector: 'core-loading-overlay',
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loading.isLoading()) {
      <div class="absolute inset-0 z-50 flex items-center justify-center bg-surface/60 backdrop-blur-[2px]">
        <mat-spinner diameter="40" />
      </div>
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  protected readonly loading = inject(LoadingService);
}
