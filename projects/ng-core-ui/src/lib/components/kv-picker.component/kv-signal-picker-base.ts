import {
  computed,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatatableColumn } from '../datatable.component/datatable.component';
import { KVOption } from '../form-shell.component/form-field.models';
import { KvSignalPickerBaseConfig } from './kv-picker.models';

export abstract class KvSignalPickerBase<T extends KvSignalPickerBaseConfig = KvSignalPickerBaseConfig> {
  protected readonly data = inject(MAT_DIALOG_DATA) as T;
  protected readonly _ref  = inject(MatDialogRef);

  protected readonly filterText = signal('');

  protected readonly filteredOptions = computed<KVOption[]>(() => {
    const text = this.filterText().toLowerCase().trim();
    if (!text) return this.data.options();
    return this.data.options().filter(o =>
      String(o.value ?? '').toLowerCase().includes(text) ||
      o.label.toLowerCase().includes(text),
    );
  });

  protected readonly columns = computed<DatatableColumn[]>(() => {
    const cols: DatatableColumn[] = [];
    if (this.data.valueColumn) {
      cols.push({ key: 'value', label: this.data.valueColumn });
    }
    cols.push({ key: 'label', label: this.data.labelColumn ?? 'Descrizione' });
    return cols;
  });

  protected cancel(): void {
    this._ref.close(null);
  }
}
