import {
  Directive,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatatableColumn, DatatableComponent, DatatableSort } from '../datatable.component/datatable.component';
import { createInMemoryLoader } from '../datatable.component/datatable-loader';
import { KVProperty } from '../../kv-options';
import { SystemService } from '../../system/system.service';
import { buildApiPath } from '../../utils';
import { KvPickerBaseConfig } from './kv-picker.models';

@Directive()
export abstract class KvPickerBase<T extends KvPickerBaseConfig = KvPickerBaseConfig> {
  protected readonly data = inject(MAT_DIALOG_DATA) as T;
  protected readonly _ref = inject(MatDialogRef);

  @ViewChild('table') private _table?: DatatableComponent;

  protected readonly filterText = signal('');
  protected readonly loader;

  protected readonly columns = computed<DatatableColumn[]>(() => {
    const cols: DatatableColumn[] = [];
    if (this.data.valueColumn) {
      cols.push({ key: 'key', label: this.data.valueColumn });
    }
    cols.push({ key: 'value', label: this.data.labelColumn ?? 'Descrizione' });
    return cols;
  });

  constructor() {
    const ctx = inject(SystemService).getEnvironmentProperty('coreContext') as string;
    const url = buildApiPath('/api', ctx, 'properties', this.data.lookupName);
    const raw = createInMemoryLoader<KVProperty>(inject(HttpClient), url, {
      filter: () => this.filterText(),
      filterFn: (row, text) => {
        const lower = text.toLowerCase();
        return row.key.toLowerCase().includes(lower) ||
               row.value.toLowerCase().includes(lower);
      },
    });
    const wrapped = (page: number, pageSize: number, sort?: DatatableSort) =>
      raw(page, pageSize, sort ?? { field: 'order', dir: 'asc' });
    wrapped.invalidate = raw.invalidate;
    this.loader = wrapped;
  }

  protected onFilter(text: string): void {
    this.filterText.set(text);
    this._table?.refresh(true);
  }

  protected cancel(): void {
    this._ref.close(null);
  }
}
