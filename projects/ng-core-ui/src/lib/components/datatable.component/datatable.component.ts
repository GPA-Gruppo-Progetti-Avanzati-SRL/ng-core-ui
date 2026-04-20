import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  Type,
  ViewEncapsulation,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, Subject, catchError, finalize, of, switchMap } from 'rxjs';

export interface DatatableColumn {
  key: string;
  label: string;
  width?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (row: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: Type<any>;
}

export interface DatatableAction<T = unknown> {
  icon: string;
  tooltip?: string;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  buttonClass?: string;
}

export interface DatatableResult<T = unknown> {
  items: T[];
  total: number;
}

export type DatatableLoader<T = unknown> = (page: number, pageSize: number) => Observable<DatatableResult<T>>;

const ACTIONS_COL = '_actions';

@Component({
  selector: 'core-datatable',
  standalone: true,
  imports: [NgComponentOutlet, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatIconModule, MatIconButton, MatTooltipModule],
  templateUrl: './datatable.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatatableComponent implements OnInit {
  readonly columns         = input.required<DatatableColumn[]>();
  readonly load            = input.required<DatatableLoader>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly actions         = input<DatatableAction<any>[]>([]);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);
  readonly initialPageSize = input<number>(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rowBackground   = input<(row: any) => string | null>();

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _trigger$   = new Subject<void>();

  protected readonly ACTIONS_COL = ACTIONS_COL;

  protected readonly isLoading        = signal(false);
  protected readonly data             = signal<unknown[]>([]);
  protected readonly total            = signal(0);
  protected readonly currentPage      = signal(1);
  protected readonly pageSize         = signal(10);
  protected readonly displayedColumns = computed(() => {
    const cols = this.columns().map(c => c.key);
    return this.actions().length ? [...cols, ACTIONS_COL] : cols;
  });
  protected readonly paddedData = computed(() => {
    const real   = this.data();
    const filler = Math.max(0, this.pageSize() - real.length);
    return [...real, ...Array.from({ length: filler }, () => ({ _empty: true }))];
  });

  ngOnInit(): void {
    this.pageSize.set(this.initialPageSize());

    this._trigger$.pipe(
      switchMap(() => {
        this.isLoading.set(true);
        return this.load()(this.currentPage(), this.pageSize()).pipe(
          catchError(() => of({ items: [], total: 0 })),
          finalize(() => this.isLoading.set(false)),
        );
      }),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(result => {
      this.data.set(result.items);
      this.total.set(result.total);
    });

    this._trigger$.next();
  }

  refresh(): void {
    this._trigger$.next();
  }

  protected onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this._trigger$.next();
  }

  protected getValue(row: unknown, key: string): unknown {
    return key.split('.').reduce(
      (obj: unknown, k) =>
        obj != null && typeof obj === 'object'
          ? (obj as Record<string, unknown>)[k]
          : undefined,
      row,
    );
  }

  protected cellInputs(row: unknown, key: string): Record<string, unknown> {
    return { value: this.getValue(row, key), row };
  }

  protected onActionClick(action: DatatableAction, row: unknown): void {
    action.onClick(row);
  }
}
