import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { SystemService } from './system.service';

const LABELS: Record<string, {
  itemsPerPage: string;
  nextPage: string;
  previousPage: string;
  firstPage: string;
  lastPage: string;
  rangeLabel: (page: number, pageSize: number, length: number) => string;
}> = {
  it: {
    itemsPerPage: 'Righe per pagina:',
    nextPage: 'Pagina successiva',
    previousPage: 'Pagina precedente',
    firstPage: 'Prima pagina',
    lastPage: 'Ultima pagina',
    rangeLabel: (page, pageSize, length) => {
      if (length === 0) return '0 di 0';
      const start = page * pageSize;
      const end = Math.min(start + pageSize, length);
      return `${start + 1} – ${end} di ${length}`;
    },
  },
  en: {
    itemsPerPage: 'Items per page:',
    nextPage: 'Next page',
    previousPage: 'Previous page',
    firstPage: 'First page',
    lastPage: 'Last page',
    rangeLabel: (page, pageSize, length) => {
      if (length === 0) return '0 of 0';
      const start = page * pageSize;
      const end = Math.min(start + pageSize, length);
      return `${start + 1} – ${end} of ${length}`;
    },
  },
};

@Injectable()
export class GpaPaginatorIntl extends MatPaginatorIntl {
  private readonly _system = inject(SystemService);

  constructor() {
    super();
    this._apply(this._system.environment()?.language ?? 'it');
    effect(() => {
      this._apply(this._system.environment()?.language ?? 'it');
      this.changes.next();
    });
  }

  private _apply(lang: string): void {
    const l = LABELS[lang] ?? LABELS['it'];
    this.itemsPerPageLabel  = l.itemsPerPage;
    this.nextPageLabel      = l.nextPage;
    this.previousPageLabel  = l.previousPage;
    this.firstPageLabel     = l.firstPage;
    this.lastPageLabel      = l.lastPage;
    this.getRangeLabel      = l.rangeLabel;
  }
}
