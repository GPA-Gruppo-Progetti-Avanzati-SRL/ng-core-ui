import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewEncapsulation, effect, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastService, ToastType } from './toast.service';

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; fg: string }> = {
  success: { icon: 'check_circle', bg: '#dcfce7', fg: '#14532d' },
  error:   { icon: 'error',        bg: '#fee2e2', fg: '#7f1d1d' },
  info:    { icon: 'info',         bg: '#dbeafe', fg: '#1e3a8a' },
  warning: { icon: 'warning',      bg: '#fef9c3', fg: '#78350f' },
};

type PopoverHTMLElement = HTMLElement & { showPopover(): void; hidePopover(): void };

@Component({
  selector: 'core-toast',
  imports: [MatIconModule],
  templateUrl: './toast.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'popover': 'manual',
    style: 'position:static;inset:auto;margin:0;padding:0;border:none;background:transparent;overflow:visible;',
  },
})
export class ToastComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  protected readonly svc = inject(ToastService);
  protected readonly cfg = TOAST_CONFIG;
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    const el = this.el.nativeElement as PopoverHTMLElement;

    effect(() => {
      const msgs = this.svc.messages();
      if (!el.isConnected) return;
      try { el.hidePopover(); } catch { /* not showing — ignore */ }
      if (msgs.length > 0) el.showPopover();
    });

    inject(DestroyRef).onDestroy(() => {
      try { el.hidePopover(); } catch { /* ignore */ }
    });
  }

  protected safeHtml(message: string) {
    return this.sanitizer.bypassSecurityTrustHtml(message);
  }
}
