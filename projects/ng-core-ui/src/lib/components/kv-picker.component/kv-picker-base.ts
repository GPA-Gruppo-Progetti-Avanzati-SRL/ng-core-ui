import {
  Directive,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DatatableColumn, DatatableComponent, DatatableLoader, DatatableSort } from '../datatable.component/datatable.component';
import { InMemoryLoader, createInMemoryLoader } from '../datatable.component/datatable-loader';
import { KVProperty } from '../../kv-options';
import { SystemService } from '../../system/system.service';
import { buildApiPath } from '../../utils';
import { KvPickerBaseConfig } from './kv-picker.models';

@Directive()
export abstract class KvPickerBase<T extends KvPickerBaseConfig = KvPickerBaseConfig> {
  protected readonly data = inject(MAT_DIALOG_DATA) as T;
  protected readonly _ref = inject(MatDialogRef);

  @ViewChild('table') protected _table?: DatatableComponent;

  protected readonly filterText = signal('');
  protected readonly loader: DatatableLoader<KVProperty>;
  private readonly _raw: InMemoryLoader<KVProperty>;

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
    this._raw = raw;
    this.loader = (page: number, pageSize: number, sort?: DatatableSort) =>
      raw(page, pageSize, sort ?? { field: 'order', dir: 'asc' });
  }

  protected getAllItems(): Observable<KVProperty[]> {
    return this._raw.getAll();
  }

  protected onFilter(text: string): void {
    this.filterText.set(text);
    this._table?.refresh(true);
  }

  protected cancel(): void {
    this._ref.close(null);
  }
}
