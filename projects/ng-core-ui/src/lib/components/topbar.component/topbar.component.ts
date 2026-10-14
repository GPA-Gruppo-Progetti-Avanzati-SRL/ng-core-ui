import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { CoreLabelsService } from '../../system/labels.service';

export interface TopbarAction {
  icon:     string;
  label:    string;
  onClick:  () => void;
  visible?:  () => boolean;
  disabled?: () => boolean;
}

@Component({
  selector: 'core-topbar',
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './topbar.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class TopbarComponent {
  readonly title       = input<string>('');
  readonly description = input<string>('');
  readonly actions     = input<TopbarAction[]>([]);

  protected readonly t = inject(CoreLabelsService).labels;

  readonly isCompact = toSignal(
    inject(BreakpointObserver).observe('(max-width: 639px)').pipe(map(r => r.matches)),
    { initialValue: false }
  );
}
