import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatatableComponent } from '../datatable.component/datatable.component';
import { CoreButtonComponent } from '../button.component/button.component';
import { LookupResult } from '../form-shell.component/form-field.models';
import { LookupDialogConfig } from '../form-shell.component/fields/lookup-field.component';
import { KVProperty } from '../../kv-options';
import { KvPickerBase } from './kv-picker-base';
import { KvSinglePickerConfig } from './kv-picker.models';

@Component({
  selector: 'core-kv-single-picker',
  imports: [DatatableComponent, CoreButtonComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './kv-single-picker.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KvSinglePickerComponent extends KvPickerBase {
  protected select(item: unknown): void {
    const kv = item as KVProperty;
    this._ref.close({ id: kv.key, label: kv.value } satisfies LookupResult);
  }
}

export function kvSinglePicker(
  data: KvSinglePickerConfig,
  title?: string,
  opts?: { width?: string; maxWidth?: string },
): LookupDialogConfig {
  return { component: KvSinglePickerComponent, title, data, ...opts };
}
