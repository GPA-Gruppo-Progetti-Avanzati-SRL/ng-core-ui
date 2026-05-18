import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Type,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EMPTY, Observable, catchError, finalize, of, switchMap } from 'rxjs';

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

export type DatatableLoader<T = unknown> = (
  page: number,
  pageSize: number,
  sort?: DatatableSort,
) => Observable<DatatableResult<T>>;

const ACTIONS_COL = '_actions';

@Component({
  selector: 'core-datatable',
  imports: [NgComponentOutlet, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatIconModule, MatIconButton, MatTooltipModule],
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

  private readonly _destroyRef = inject(DestroyRef);

  protected readonly ACTIONS_COL = ACTIONS_COL;

  protected readonly isLoading         = signal(false);
  protected readonly hasError          = signal(false);
  protected readonly rows              = signal<unknown[]>([]);
  protected readonly total             = signal(0);
  protected readonly currentPage       = signal(1);
  protected readonly pageSize          = linkedSignal(() => this.initialPageSize());
  protected readonly currentSort       = signal<DatatableSort>(null);
  protected readonly hasVisibleActions = computed(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.actions().some(a => a.visible?.(null as any) ?? true)
  );
  protected readonly displayedColumns = computed(() => {
    const cols = this.columns().map(c => c.key);
    return this.hasVisibleActions() ? [...cols, ACTIONS_COL] : cols;
  });
  private readonly _accessors = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accs = new Map<string, (row: any) => any>();
    for (const col of this.columns()) {
      const parts = col.key.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accs.set(col.key, (row: any) => parts.reduce((obj, k) => (obj != null && typeof obj === 'object' ? obj[k] : undefined), row));
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
          const cmp = _compareValues(_getNestedValue(a, sort.field), _getNestedValue(b, sort.field));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }

      const total = items.length;
      const start  = (page - 1) * size;
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
          catchError(() => {
            this.hasError.set(true);
            return of({ items: [], total: 0 });
          }),
          finalize(() => this.isLoading.set(false)),
        );
      }),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(result => {
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
}

function _getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce(
    (o: unknown, k) => (o != null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

function _compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
