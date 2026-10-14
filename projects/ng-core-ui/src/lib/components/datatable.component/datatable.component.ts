import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Signal,
  Type,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EMPTY, Observable, catchError, finalize, map, of, switchMap } from 'rxjs';
import { CoreLabelsService } from '../../system/labels.service';
import { compareValues, getNestedValue } from './datatable-utils';

export interface DatatableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (row: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: Type<any>;
}

export interface DatatableAction<T = unknown> {
  icon: string;
  tooltip?: string;
  onClick: (row: T) => void;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  buttonClass?: string;
}

export interface DatatableResult<T = unknown> {
  items: T[];
  total: number;
}

export type DatatableSort = { field: string; dir: 'asc' | 'desc' } | null;

export type DatatableSelectionMode = 'none' | 'single' | 'multi';

export type DatatableLoader<T = unknown> = (
  page: number,
  pageSize: number,
  sort?: DatatableSort,
) => Observable<DatatableResult<T>>;

const ACTIONS_COL = '_actions';
const SELECTION_COL = '_selection';

@Component({
  selector: 'core-datatable',
  imports: [NgComponentOutlet, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatIconModule, MatButton, MatIconButton, MatTooltipModule, MatCheckbox],
  templateUrl: './datatable.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class DatatableComponent {
  readonly columns         = input.required<DatatableColumn[]>();
  readonly load            = input<DatatableLoader | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly data            = input<(() => any[]) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly actions         = input<DatatableAction<any>[]>([]);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);
  readonly initialPageSize = input<number>(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rowBackground   = input<(row: any) => string | null>();
  readonly selectionMode      = input<DatatableSelectionMode>('none');
  readonly initialSelection   = input<unknown[]>([]);
  /**
   * Identità di una riga per la selezione (es. `row => row.id`). Senza, le righe si confrontano
   * per riferimento: con un loader server-side ogni fetch crea oggetti nuovi e la selezione si perde.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rowKey             = input<((row: any) => unknown) | null>(null);
  /** Default: testo `datatable.empty` del dizionario (it: 'Nessun dato'). */
  readonly emptyMessage       = input<string>();

  readonly selectionChange = output<unknown[]>();
  /** Errore del loader; la tabella mostra comunque il messaggio con "Riprova". */
  readonly loadError       = output<unknown>();

  private readonly _destroyRef = inject(DestroyRef);
  protected readonly t = inject(CoreLabelsService).labels;

  protected readonly ACTIONS_COL = ACTIONS_COL;
  protected readonly SELECTION_COL = SELECTION_COL;
  protected readonly radioGroupName = `dt-sel-${Math.random().toString(36).slice(2)}`;

  private readonly _selectedRows = linkedSignal(() => this.initialSelection());
  readonly selectedRows: Signal<unknown[]> = this._selectedRows.asReadonly();

  protected readonly isLoading         = linkedSignal(() => this.load() != null);
  protected readonly hasError          = signal(false);
  protected readonly rows              = signal<unknown[]>([]);
  protected readonly total             = signal(0);
  protected readonly currentPage       = signal(1);
  protected readonly pageSize          = linkedSignal(() => this.initialPageSize());
  protected readonly currentSort       = signal<DatatableSort>(null);
  // `visible` riceve sempre una riga vera: chiamarlo con null rompe i predicati come `r => r.stato`.
  protected readonly hasVisibleActions = computed(() => {
    const actions = this.actions();
    return actions.length > 0 && this.rows().some(row => actions.some(a => a.visible?.(row) ?? true));
  });
  protected readonly displayedColumns = computed(() => {
    const cols = this.columns().map(c => c.key);
    const withSel = this.selectionMode() !== 'none' ? [SELECTION_COL, ...cols] : cols;
    return this.hasVisibleActions() ? [...withSel, ACTIONS_COL] : withSel;
  });
  private readonly _accessors = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accs = new Map<string, (row: any) => any>();
    for (const col of this.columns()) {
      accs.set(col.key, (row: unknown) => getNestedValue(row, col.key));
    }
    return accs;
  });

  // Incrementato da refresh() per forzare un reload senza cambiare page/sort.
  private readonly _refreshTick = signal(0);

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      effect(() => {
        if (!this.load() && !this.data()) {
          console.warn('core-datatable: nessuna sorgente dati — fornire [load] o [data].');
        }
      });
    }

    // Modalità signal: sort + paginazione in-memory, reattiva automaticamente.
    effect(() => {
      const dataFn = this.data();
      if (!dataFn) return;

      let items = dataFn() as unknown[];
      const sort    = this.currentSort();
      const page    = this.currentPage();
      const size    = this.pageSize();
      this._refreshTick(); // tracked: refresh() forza la riesecuzione

      if (sort) {
        items = [...items].sort((a, b) => {
          const cmp = compareValues(getNestedValue(a, sort.field), getNestedValue(b, sort.field));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }

      const total = items.length;
      const start  = (page - 1) * size;
      if (this._clampPage(page, size, total, start >= total)) return;
      this.rows.set(items.slice(start, start + size));
      this.total.set(total);
    });

    // Modalità loader: fetch HTTP con switchMap (cancellazione automatica).
    toObservable(
      computed(() => ({
        load: this.load(),
        page: this.currentPage(),
        size: this.pageSize(),
        sort: this.currentSort(),
        tick: this._refreshTick(),
      })),
    ).pipe(
      switchMap(({ load, page, size, sort }) => {
        if (!load) return EMPTY;
        this.isLoading.set(true);
        this.hasError.set(false);
        return load(page, size, sort).pipe(
          map(result => ({ result, page, size })),
          catchError(err => {
            this.hasError.set(true);
            this.loadError.emit(err);
            return of({ result: { items: [], total: 0 }, page, size });
          }),
          finalize(() => this.isLoading.set(false)),
        );
      }),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(({ result, page, size }) => {
      if (this._clampPage(page, size, result.total, result.items.length === 0)) return;
      this.rows.set(result.items);
      this.total.set(result.total);
    });
  }

  refresh(resetPage = false): void {
    if (resetPage) this.currentPage.set(1);
    this._refreshTick.update(n => n + 1);
  }

  protected onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
  }

  protected onSortChange(col: DatatableColumn): void {
    if (!col.sortable) return;
    const current = this.currentSort();
    if (current?.field === col.key) {
      this.currentSort.set({ field: col.key, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      this.currentSort.set({ field: col.key, dir: 'asc' });
    }
    this.currentPage.set(1);
  }

  protected getValue(row: unknown, key: string): unknown {
    return this._accessors().get(key)?.(row);
  }

  protected cellInputs(row: unknown, key: string): Record<string, unknown> {
    return { value: this.getValue(row, key), row };
  }

  protected onActionClick(action: DatatableAction, row: unknown): void {
    action.onClick(row);
  }

  protected ariaSort(col: DatatableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    const sort = this.currentSort();
    if (sort?.field !== col.key) return 'none';
    return sort.dir === 'asc' ? 'ascending' : 'descending';
  }

  /** Chiavi delle righe selezionate, ricalcolate solo quando cambia la selezione o `rowKey`. */
  private readonly _selectedKeys = computed(() => new Set(this._selectedRows().map(r => this._keyOf(r))));

  private _keyOf(row: unknown): unknown {
    const key = this.rowKey();
    return key ? key(row) : row;
  }

  protected isSelected(row: unknown): boolean {
    return this._selectedKeys().has(this._keyOf(row));
  }

  protected allPageSelected(): boolean {
    const rows = this.rows();
    return rows.length > 0 && rows.every(r => this.isSelected(r));
  }

  protected somePageSelected(): boolean {
    return this.rows().some(r => this.isSelected(r)) && !this.allPageSelected();
  }

  protected toggleRow(row: unknown): void {
    const mode = this.selectionMode();
    if (mode === 'none') return;
    const key = this._keyOf(row);
    const selected = this.isSelected(row);
    let next: unknown[];
    if (mode === 'single') {
      next = selected ? [] : [row];
    } else {
      next = selected
        ? this._selectedRows().filter(r => this._keyOf(r) !== key)
        : [...this._selectedRows(), row];
    }
    this._selectedRows.set(next);
    this.selectionChange.emit(next);
  }

  protected toggleAllPage(): void {
    const rows = this.rows();
    const pageKeys = new Set(rows.map(r => this._keyOf(r)));
    const others = this._selectedRows().filter(r => !pageKeys.has(this._keyOf(r)));
    const next = this.allPageSelected() ? others : [...others, ...rows];
    this._selectedRows.set(next);
    this.selectionChange.emit(next);
  }

  /**
   * Pagina oltre la fine (es. dopo aver cancellato l'ultima riga dell'ultima pagina): torna
   * all'ultima pagina esistente invece di mostrare una pagina vuota. Ritorna true se ha corretto.
   */
  private _clampPage(page: number, size: number, total: number, pageEmpty: boolean): boolean {
    if (page <= 1 || !pageEmpty || total <= 0) return false;
    const last = Math.max(1, Math.ceil(total / size));
    if (page <= last) return false;
    this.currentPage.set(last);
    return true;
  }

  clearSelection(): void {
    this._selectedRows.set([]);
    this.selectionChange.emit([]);
  }
}
