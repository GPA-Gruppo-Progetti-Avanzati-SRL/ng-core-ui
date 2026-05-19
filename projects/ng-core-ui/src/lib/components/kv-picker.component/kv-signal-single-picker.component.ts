import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatatableComponent } from '../datatable.component/datatable.component';
import { CoreButtonComponent } from '../button.component/button.component';
import { KVOption, LookupResult } from '../form-shell.component/form-field.models';
import { LookupDialogConfig } from '../form-shell.component/fields/lookup-field.component';
import { KvSignalPickerBase } from './kv-signal-picker-base';
import { KvSignalSinglePickerConfig } from './kv-picker.models';

@Component({
  selector: 'core-kv-signal-single-picker',
  imports: [DatatableComponent, CoreButtonComponent, MatFormFieldModule, MatInputModule],
  templateUrl: './kv-signal-single-picker.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KvSignalSinglePickerComponent extends KvSignalPickerBase {
  protected select(item: unknown): void {
    const kv = item as KVOption;
    this._ref.close({ id: kv.value, label: kv.label } satisfies LookupResult);
  }
}

export function kvSignalSinglePicker(
  data: KvSignalSinglePickerConfig,
  title?: string,
  opts?: { width?: string; maxWidth?: string },
): LookupDialogConfig {
  return { component: KvSignalSinglePickerComponent, title, data, ...opts };
}
