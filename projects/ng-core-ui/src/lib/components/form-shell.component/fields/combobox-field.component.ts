import { ChangeDetectionStrategy, Component, Signal, ViewEncapsulation, computed, input, isSignal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormField, FieldTree } from '@angular/forms/signals';
import { FormFieldDef } from '../form-field.models';

export interface ComboboxOption {
  value: any;
  label: string;
}

@Component({
  selector: 'core-combobox-field',
  imports: [MatFormFieldModule, MatSelectModule, FormField],
  templateUrl: './combobox-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboboxFieldComponent {
  readonly formField   = input.required<any>();
  readonly options     = input<ComboboxOption[] | Signal<ComboboxOption[]>>([]);
  readonly label       = input<string>('');

  readonly resolvedOptions = computed<ComboboxOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<ComboboxOption[]>)() : opts as ComboboxOption[];
  });
}
