import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CoreLabelsService } from '../../system/labels.service';

@Component({
  selector: 'core-card',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './card.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class CardComponent {
  readonly title       = input<string>('');
  readonly subtitle    = input<string>('');
  readonly icon        = input<string>('info');
  /** Default: testo `card.action` del dizionario (it: 'Procedi'). */
  readonly buttonLabel = input<string>();
  readonly disabled = input<boolean>(false);
  readonly disabledReason = input<string>('');
  readonly buttonClick = output<void>();

  protected readonly t = inject(CoreLabelsService).labels;

  isSubtitleTooltipDisabled(el: HTMLElement): boolean {
    return el.scrollHeight <= el.clientHeight;
  }

  onClick(): void {
    if (this.disabled()) return;
    this.buttonClick.emit();
  }
}
