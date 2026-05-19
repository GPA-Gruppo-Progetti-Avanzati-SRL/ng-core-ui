import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'core-button',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './button.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreButtonComponent {
  readonly icon     = input<string>();
  readonly label    = input<string>();
  readonly tooltip  = input<string>('');
  readonly variant  = input<'icon' | 'text' | 'filled'>('filled');
  readonly disabled = input<boolean>(false);

  protected readonly effectiveVariant = computed<'icon' | 'text' | 'filled'>(() =>
    this.variant() ?? (this.label() ? 'text' : 'icon')
  );
}
