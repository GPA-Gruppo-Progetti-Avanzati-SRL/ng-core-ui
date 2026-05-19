import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatatableComponent } from '../datatable.component/datatable.component';
import { CoreButtonComponent } from '../button.component/button.component';
import { LookupResult } from '../form-shell.component/form-field.models';
import { LookupDialogConfig } from '../form-shell.component/fields/lookup-field.component';
import { KVProperty } from '../../kv-options';
import { KvPickerBase } from './kv-picker-base';
import { KvMultiPickerConfig } from './kv-picker.models';

@Component({
  selector: 'core-kv-multi-picker',
  imports: [DatatableComponent, CoreButtonComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './kv-multi-picker.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KvMultiPickerComponent extends KvPickerBase<KvMultiPickerConfig> {
  protected readonly selectedItems = signal<unknown[]>([]);

  protected confirm(): void {
    const items = this.selectedItems() as KVProperty[];
    this._ref.close({
      id:    items.map(i => i.key),
      label: items.map(i => i.value).join(', '),
    } satisfies LookupResult);
  }
}

export function kvMultiPicker(
  data: KvMultiPickerConfig,
  title?: string,
  opts?: { width?: string; maxWidth?: string },
): LookupDialogConfig {
  return { component: KvMultiPickerComponent, title, data, ...opts };
}
