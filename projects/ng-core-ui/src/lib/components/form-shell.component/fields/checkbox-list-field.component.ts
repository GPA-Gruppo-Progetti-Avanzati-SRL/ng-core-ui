import { ChangeDetectionStrategy, Component, Signal, ViewEncapsulation, computed, input, isSignal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormField } from '@angular/forms/signals';

export interface CheckboxOption {
  value: any;
  label: string;
}

@Component({
  selector: 'core-checkbox-list-field',
  imports: [MatCheckboxModule, FormField],
  templateUrl: './checkbox-list-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxListFieldComponent {
  readonly formField   = input.required<any>();
  readonly options     = input<CheckboxOption[] | Signal<CheckboxOption[]>>([]);
  readonly label       = input<string>('');
  readonly inline      = input<boolean>(false);

  readonly resolvedOptions = computed<CheckboxOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<CheckboxOption[]>)() : opts as CheckboxOption[];
  });

  toggle(optionValue: any) {
    const state = this.formField()();
    const currentValues = (state.value() as any[]) || [];
    const index = currentValues.indexOf(optionValue);
    
    let nextValues: any[];
    if (index === -1) {
      nextValues = [...currentValues, optionValue];
    } else {
      nextValues = currentValues.filter(v => v !== optionValue);
    }
    
    state.value.set(nextValues);
    state.markAsTouched();
  }

  isSelected(optionValue: any): boolean {
    const currentValues = (this.formField()().value() as any[]) || [];
    return Array.isArray(currentValues) && currentValues.includes(optionValue);
  }
}
