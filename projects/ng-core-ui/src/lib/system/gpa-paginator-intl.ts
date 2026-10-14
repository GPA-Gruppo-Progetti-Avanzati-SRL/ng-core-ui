import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CoreLabelsService } from './labels.service';

/** Testi del paginator dal dizionario della libreria (`labels.paginator`), reattivi alla lingua. */
@Injectable()
export class GpaPaginatorIntl extends MatPaginatorIntl {
  private readonly _labels = inject(CoreLabelsService).labels;

  constructor() {
    super();
    this._apply();
    effect(() => {
      this._apply();
      this.changes.next();
    });
  }

  private _apply(): void {
    const l = this._labels().paginator;
    this.itemsPerPageLabel = l.itemsPerPage;
    this.nextPageLabel     = l.nextPage;
    this.previousPageLabel = l.previousPage;
    this.firstPageLabel    = l.firstPage;
    this.lastPageLabel     = l.lastPage;
    this.getRangeLabel     = l.rangeLabel;
  }
}
