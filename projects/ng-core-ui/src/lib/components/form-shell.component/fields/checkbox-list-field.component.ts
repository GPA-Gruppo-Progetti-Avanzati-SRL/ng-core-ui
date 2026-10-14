import { ChangeDetectionStrategy, Component, Signal, ViewEncapsulation, computed, inject, input, isSignal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { KVOption } from '../form-field.models';
import { CoreLabelsService } from '../../../system/labels.service';

let nextId = 0;

/**
 * Lista di checkbox su un campo array. Non usa `[formField]` (il valore è un array costruito qui),
 * quindi legge a mano dal field state `disabled`/`readonly`, che lo schema può impostare.
 */
@Component({
  selector: 'core-checkbox-list-field',
  imports: [MatCheckboxModule],
  templateUrl: './checkbox-list-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxListFieldComponent {
  readonly formField   = input.required<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly options     = input<KVOption[] | Signal<KVOption[]>>([]);
  readonly label       = input<string>('');
  readonly inline      = input<boolean>(false);

  protected readonly t = inject(CoreLabelsService).labels;
  protected readonly labelId = `core-checkbox-list-${nextId++}`;

  readonly resolvedOptions = computed<KVOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<KVOption[]>)() : opts as KVOption[];
  });

  /** false se lo schema rende il campo `disabled` o `readonly`. */
  protected readonly editable = computed(() => {
    const state = this.formField()();
    return !(state.disabled?.() ?? false) && !(state.readonly?.() ?? false);
  });

  private readonly selectedValues = computed<unknown[]>(() => {
    const v = this.formField()().value();
    return Array.isArray(v) ? v : [];
  });

  toggle(optionValue: unknown): void {
    if (!this.editable()) return;
    const state = this.formField()();
    const current = this.selectedValues();
    const next = current.includes(optionValue)
      ? current.filter(v => v !== optionValue)
      : [...current, optionValue];
    state.value.set(next);
    state.markAsTouched();
  }

  isSelected(optionValue: unknown): boolean {
    return this.selectedValues().includes(optionValue);
  }
}
