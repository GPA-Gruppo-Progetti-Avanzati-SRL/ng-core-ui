import { ChangeDetectionStrategy, Component, DestroyRef, ViewEncapsulation, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  protected readonly preSelected = signal<unknown[]>([]);

  constructor() {
    super();
    const ids = this.data.initialIds ?? [];
    if (ids.length > 0) {
      const destroyRef = inject(DestroyRef);
      this.getAllItems()
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(all => {
          this.preSelected.set((all as KVProperty[]).filter(item => ids.includes(item.key)));
        });
    }
  }

  protected confirm(): void {
    const items = (this._table?.selectedRows() ?? []) as KVProperty[];
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
