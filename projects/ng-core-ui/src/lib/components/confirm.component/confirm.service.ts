import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' colora il bottone di conferma in rosso (es. per eliminazioni). */
  type?: 'default' | 'danger';
}

export interface ConfirmState extends Required<ConfirmOptions> {
  resolve: (result: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise(resolve => {
      this.state.set({
        title:         options.title         ?? 'Conferma',
        message:       options.message,
        confirmLabel:  options.confirmLabel  ?? 'Conferma',
        cancelLabel:   options.cancelLabel   ?? 'Annulla',
        type:          options.type          ?? 'default',
        resolve,
      });
    });
  }

  respond(result: boolean): void {
    this.state()?.resolve(result);
    this.state.set(null);
  }
}
