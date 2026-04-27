import { Signal, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KVOption } from './components/form-shell.component/form-field.models';
import { ToastService } from './components/toast.component/toast.service';

export interface KVProperty {
  key:   string;
  value: string;
  order: number;
  kind:  string;
}

export interface KVResponse {
  _id:         string;
  _bid:        string;
  scope:       string;
  _et:         string;
  category:    string;
  description: string;
  inherited:   boolean;
  properties:  KVProperty[];
  sys_info:    any;
}

/**
 * Carica le opzioni da un endpoint GPA che ritorna un `KVResponse`.
 * Deve essere chiamata in contesto di iniezione (field initializer o costruttore).
 *
 * @param url     Path completo dell'endpoint (es. buildApiPath(...))
 * @param blank   Se `true` (default) aggiunge un'opzione vuota `{ value: '', label: '' }` in testa
 */
export function loadKVOptions(url: string, blank = true): Signal<KVOption[]> {
  const http  = inject(HttpClient);
  const toast = inject(ToastService);
  const opts  = signal<KVOption[]>([]);

  http.get<KVResponse>(url).subscribe({
    next: (res) => {
      const mapped: KVOption[] = res.properties
        .sort((a, b) => a.order - b.order)
        .map(p => ({ value: p.key, label: p.value }));
      opts.set(blank ? [{ value: '', label: '' }, ...mapped] : mapped);
    },
    error: (err) => {
      toast.error('Errore nel caricamento delle opzioni');
      console.error(err);
    },
  });

  return opts.asReadonly();
}
