import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatatableComponent } from '../datatable.component/datatable.component';
import { CoreButtonComponent } from '../button.component/button.component';
import { KVOption, LookupResult } from '../form-shell.component/form-field.models';
import { LookupDialogConfig } from '../form-shell.component/fields/lookup-field.component';
import { KvSignalPickerBase } from './kv-signal-picker-base';
import { KvSignalMultiPickerConfig } from './kv-picker.models';

@Component({
  selector: 'core-kv-signal-multi-picker',
  imports: [DatatableComponent, CoreButtonComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './kv-signal-multi-picker.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KvSignalMultiPickerComponent extends KvSignalPickerBase<KvSignalMultiPickerConfig> {
  protected readonly selectedItems = signal<unknown[]>([]);

  protected confirm(): void {
    const items = this.selectedItems() as KVOption[];
    this._ref.close({
      id:    items.map(i => i.value),
      label: items.map(i => i.label).join(', '),
    } satisfies LookupResult);
  }
}

export function kvSignalMultiPicker(
  data: KvSignalMultiPickerConfig,
  title?: string,
  opts?: { width?: string; maxWidth?: string },
): LookupDialogConfig {
  return { component: KvSignalMultiPickerComponent, title, data, ...opts };
}
