import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
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
  readonly buttonLabel = input<string>('Procedi');
  readonly buttonClick = output<void>();

  isSubtitleTooltipDisabled(el: HTMLElement): boolean {
    return el.scrollHeight <= el.clientHeight;
  }
}
