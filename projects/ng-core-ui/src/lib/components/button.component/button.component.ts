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

export type ButtonColor = 'primary' | 'secondary' | 'tertiary' | 'success' | 'info' | 'warn' | 'error';

const BG_CLASSES: Record<ButtonColor, string> = {
  primary:   '!bg-primary !text-on-primary',
  secondary: '!bg-secondary !text-on-secondary',
  tertiary:  '!bg-tertiary !text-on-tertiary',
  success:   '!bg-green-600 !text-white',
  info:      '!bg-sky-600 !text-white',
  warn:      '!bg-amber-500 !text-black',
  error:     '!bg-error !text-on-error',
};

const TEXT_CLASSES: Record<ButtonColor, string> = {
  primary:   '!text-primary',
  secondary: '!text-secondary',
  tertiary:  '!text-tertiary',
  success:   '!text-green-600',
  info:      '!text-sky-600',
  warn:      '!text-amber-500',
  error:     '!text-error',
};

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
  readonly color    = input<ButtonColor>('tertiary');
  readonly disabled = input<boolean>(false);

  readonly bgClass   = computed(() => BG_CLASSES[this.color()]);
  readonly textClass = computed(() => TEXT_CLASSES[this.color()]);
}
