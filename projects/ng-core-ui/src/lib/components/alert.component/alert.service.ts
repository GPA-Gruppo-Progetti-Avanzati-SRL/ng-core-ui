import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AlertComponent } from './alert.component';
import { CoreLabelsService } from '../../system/labels.service';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

export interface AlertOptions {
  title?: string;
  message: string;
  /**
   * true: `message` è HTML (es. `<b>`, `<br>`, liste, link). Passa dalla sanitizzazione standard
   * di Angular: script, handler `on*` e attributi `style` vengono rimossi.
   */
  isHtml?: boolean;
  closeLabel?: string;
  type?: AlertType;
}

export type AlertData = Required<AlertOptions>;

/**
 * Dialog modale di avviso su `MatDialog` (role `alertdialog`): funziona in ogni layout, più
 * avvisi si impilano e ognuno risolve la propria Promise alla chiusura (bottone, Esc o backdrop).
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly dialog = inject(MatDialog);
  private readonly labels = inject(CoreLabelsService).labels;

  alert(options: AlertOptions): Promise<void> {
    const t = this.labels().alert;
    const data: AlertData = {
      title:      options.title      ?? t.title,
      message:    options.message,
      closeLabel: options.closeLabel ?? t.close,
      type:       options.type       ?? 'info',
      isHtml:     options.isHtml     ?? false,
    };
    const ref = this.dialog.open<AlertComponent, AlertData>(AlertComponent, {
      data,
      role: 'alertdialog',
      width: '24rem',
      maxWidth: '95vw',
      panelClass: ['ui', 'core-dialog'],
    });
    return firstValueFrom(ref.afterClosed()).then(() => undefined);
  }
}
