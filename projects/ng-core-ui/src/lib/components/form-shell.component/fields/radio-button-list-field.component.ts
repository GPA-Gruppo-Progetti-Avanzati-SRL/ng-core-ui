import { CoreLabelsService } from '../../../system/labels.service';
import { ChangeDetectionStrategy, Component, Signal, ViewEncapsulation, computed, input, isSignal, inject } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { FormField } from '@angular/forms/signals';
import { KVOption } from '../form-field.models';


let nextId = 0;

@Component({
  selector: 'core-radio-button-list-field',
  imports: [MatRadioModule, FormField],
  templateUrl: './radio-button-list-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonListFieldComponent {
  protected readonly t = inject(CoreLabelsService).labels;
  protected readonly labelId = `core-radio-list-${nextId++}`;
  readonly formField   = input.required<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly options     = input<KVOption[] | Signal<KVOption[]>>([]);
  readonly label       = input<string>('');
  readonly inline      = input<boolean>(false);

  readonly resolvedOptions = computed<KVOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<KVOption[]>)() : opts as KVOption[];
  });
}
