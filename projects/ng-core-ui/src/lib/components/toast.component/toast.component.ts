import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, ToastType } from './toast.service';

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; fg: string }> = {
  success: { icon: 'check_circle', bg: '#dcfce7', fg: '#14532d' },
  error:   { icon: 'error',        bg: '#fee2e2', fg: '#7f1d1d' },
  info:    { icon: 'info',         bg: '#dbeafe', fg: '#1e3a8a' },
  warning: { icon: 'warning',      bg: '#fef9c3', fg: '#78350f' },
};

@Component({
  selector: 'core-toast',
  imports: [MatIconModule],
  templateUrl: './toast.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly svc = inject(ToastService);
  protected readonly cfg = TOAST_CONFIG;
}
