import { Injectable, signal } from '@angular/core';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

export interface AlertOptions {
  title?: string;
  message: string;
  closeLabel?: string;
  type?: AlertType;
}

export interface AlertState extends Required<AlertOptions> {
  resolve: () => void;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  readonly state = signal<AlertState | null>(null);

  alert(options: AlertOptions): Promise<void> {
    return new Promise(resolve => {
      this.state.set({
        title:      options.title      ?? 'Avviso',
        message:    options.message,
        closeLabel: options.closeLabel ?? 'Chiudi',
        type:       options.type       ?? 'info',
        resolve,
      });
    });
  }

  close(): void {
    this.state()?.resolve();
    this.state.set(null);
  }
}
