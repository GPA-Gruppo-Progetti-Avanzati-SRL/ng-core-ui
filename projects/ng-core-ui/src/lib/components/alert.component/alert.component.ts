import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { AlertData, AlertType } from './alert.service';

const ALERT_CONFIG: Record<AlertType, { icon: string; bg: string; fg: string }> = {
  info:    { icon: 'info',         bg: '#dbeafe', fg: '#1e3a8a' },
  success: { icon: 'check_circle', bg: '#dcfce7', fg: '#14532d' },
  warning: { icon: 'warning',      bg: '#fef9c3', fg: '#78350f' },
  danger:  { icon: 'error',        bg: '#fee2e2', fg: '#7f1d1d' },
};

/** Contenuto del dialog aperto da `AlertService.alert()`. Non va messo nei template. */
@Component({
  selector: 'core-alert',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './alert.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  protected readonly data = inject<AlertData>(MAT_DIALOG_DATA);
  protected readonly cfg = ALERT_CONFIG[this.data.type];
}
