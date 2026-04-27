import { ChangeDetectionStrategy, Component, Signal, ViewEncapsulation, computed, input, isSignal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { KVOption } from '../form-field.models';


@Component({
  selector: 'core-combobox-field',
  imports: [MatFormFieldModule, MatSelectModule, FormField],
  templateUrl: './combobox-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboboxFieldComponent {
  readonly formField   = input.required<any>();
  readonly options     = input<KVOption[] | Signal<KVOption[]>>([]);
  readonly label       = input<string>('');

  readonly resolvedOptions = computed<KVOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<KVOption[]>)() : opts as KVOption[];
  });
}
