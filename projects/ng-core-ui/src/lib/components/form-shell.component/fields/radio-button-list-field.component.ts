import { ChangeDetectionStrategy, Component, Signal, ViewEncapsulation, computed, input, isSignal } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { FormField } from '@angular/forms/signals';
import { KVOption } from '../form-field.models';


@Component({
  selector: 'core-radio-button-list-field',
  imports: [MatRadioModule, FormField],
  templateUrl: './radio-button-list-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonListFieldComponent {
  readonly formField   = input.required<any>();
  readonly options     = input<KVOption[] | Signal<KVOption[]>>([]);
  readonly label       = input<string>('');
  readonly inline      = input<boolean>(false);

  readonly resolvedOptions = computed<KVOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<KVOption[]>)() : opts as KVOption[];
  });
}
