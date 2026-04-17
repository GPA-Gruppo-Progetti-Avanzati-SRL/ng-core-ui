import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _counter = 0;
  readonly messages = signal<ToastMessage[]>([]);

  success(message: string, duration = 3000): void {
    this._push({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this._push({ type: 'error', message, duration });
  }

  info(message: string, duration = 3000): void {
    this._push({ type: 'info', message, duration });
  }

  warning(message: string, duration = 4000): void {
    this._push({ type: 'warning', message, duration });
  }

  dismiss(id: number): void {
    this.messages.update(list => list.filter(m => m.id !== id));
  }

  private _push(opts: Omit<ToastMessage, 'id'>): void {
    const id = ++this._counter;
    this.messages.update(list => [...list, { id, ...opts }]);
    setTimeout(() => this.dismiss(id), opts.duration);
  }
}
