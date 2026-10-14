import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmComponent } from './confirm.component';
import { CoreLabelsService } from '../../system/labels.service';

export interface ConfirmOptions {
  title?: string;
  message: string;
  /**
   * true: `message` è HTML (es. `<b>`, `<br>`, liste, link). Passa dalla sanitizzazione standard
   * di Angular: script, handler `on*` e attributi `style` vengono rimossi.
   */
  isHtml?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' colora il bottone di conferma in rosso (es. per eliminazioni). */
  type?: 'default' | 'danger';
}

export type ConfirmData = Required<ConfirmOptions>;

/**
 * Dialog modale di conferma su `MatDialog`: funziona in ogni layout (anche senza layout),
 * più richieste si impilano e ognuna risolve la propria Promise. Esc, click sul backdrop e
 * "Annulla" risolvono `false`.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);
  private readonly labels = inject(CoreLabelsService).labels;

  confirm(options: ConfirmOptions): Promise<boolean> {
    const t = this.labels().confirm;
    const data: ConfirmData = {
      title:        options.title        ?? t.title,
      message:      options.message,
      confirmLabel: options.confirmLabel ?? t.confirm,
      cancelLabel:  options.cancelLabel  ?? t.cancel,
      type:         options.type         ?? 'default',
      isHtml:       options.isHtml       ?? false,
    };
    const ref = this.dialog.open<ConfirmComponent, ConfirmData, boolean>(ConfirmComponent, {
      data,
      width: '24rem',
      maxWidth: '95vw',
      panelClass: ['ui', 'core-dialog'],
    });
    return firstValueFrom(ref.afterClosed()).then(result => result === true);
  }
}
