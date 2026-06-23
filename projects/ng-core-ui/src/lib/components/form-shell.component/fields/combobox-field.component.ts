import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  ViewChild,
  ViewEncapsulation,
  computed,
  input,
  isSignal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormField } from '@angular/forms/signals';
import { KVOption } from '../form-field.models';

@Component({
  selector: 'core-combobox-field',
  imports: [MatFormFieldModule, MatSelectModule, MatOptionModule, FormField],
  templateUrl: './combobox-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComboboxFieldComponent {
  readonly formField = input.required<any>();
  readonly options = input<KVOption[] | Signal<KVOption[]>>([]);
  readonly label = input<string>('');

  @ViewChild(MatSelect) private _select?: MatSelect;

  readonly resolvedOptions = computed<KVOption[]>(() => {
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<KVOption[]>)() : (opts as KVOption[]);
  });

  protected readonly isReadonly = computed<boolean>(
    () => this.formField()?.()?.readonly?.() ?? false,
  );

  protected onOpened(): void {
    if (this.isReadonly()) this._select?.close();
  }
}
