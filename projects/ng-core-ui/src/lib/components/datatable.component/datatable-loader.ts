import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatatableLoader, DatatableResult, DatatableSort } from './datatable.component';

/**
 * Crea un DatatableLoader per le API GPA che seguono la convenzione scatolotto-be:
 *   GET <url>?pagenumber=N&pagesize=M[&sort=field:dir][&filtro=valore]
 *   Header richiesta: opzionali, passati tramite extraHeaders
 *   Response body:    T[]
 *   Response header:  totalCount: <count>
 *
 * @param http         HttpClient da iniettare nel componente chiamante
 * @param url          URL dell'endpoint (es. '/api/v1/persons')
 * @param params  Callback che restituisce i parametri di filtro correnti
 * @param headers  Callback che restituisce headers per la request
 *
 * @example
 *   readonly loader = createPagedLoader<Person>(this.http, this.path);
 *
 *   // Con filtri dinamici:
 *   readonly loader = createPagedLoader<Person>(
 *     this.http, this.path,
 *     () => ({ luogodiNascita: this.searchForm.model().luogodiNascita }),
 *   );
 */
export function createPagedLoader<T>(
  http: HttpClient,
  url: string,
  params?: () => Record<string, string | number>,
  headers?: () => Record<string, string>,
): DatatableLoader<T> {
  return (page: number, pageSize: number, sort?: DatatableSort) => {
    const sortParams: Record<string, string> = sort
      ? { sort: `${sort.field}:${sort.dir}` }
      : {};
    return http.get<T[]>(url, {
      headers: headers?.() ?? {},
      params: { pagenumber: page, pagesize: pageSize, ...(params?.() ?? {}), ...sortParams },
      observe: 'response',
    }).pipe(
      map(resp => ({
        items: resp.body ?? [],
        total: parseInt(resp.headers.get('totalCount') ?? '0', 10),
      })),
    );
  };
}

// ---------------------------------------------------------------------------

export interface InMemoryLoaderOptions<T> {
  /**
   * Parametri aggiuntivi da passare all'URL (es. filtri fissi lato server).
   * Valutati solo al momento del fetch iniziale.
   */
  extraParams?: () => Record<string, string | number>;

  /**
   * Segnale (o funzione) che restituisce il testo di ricerca corrente.
   * Viene rievalutato ad ogni chiamata del loader (es. dopo datatable.refresh()).
   */
  filter?: () => string;

  /**
   * Predicato di filtro custom.
   * Se omesso ma `filter` è fornito, viene applicata una ricerca case-insensitive
   * su tutti i campi stringa del record.
   */
  filterFn?: (row: T, filterText: string) => boolean;
}

/**
 * Crea un DatatableLoader che scarica tutti i record in un'unica chiamata
 * e gestisce paginazione, ordinamento e filtro interamente lato client.
 *
 * Il dataset completo viene cachato nel closure; per forzare un re-fetch
 * (es. dopo una creazione/modifica) usa `loader.invalidate()` prima di
 * chiamare `datatable.refresh()`.
 *
 * Formato risposta supportato:
 *   - array diretto: `T[]`
 *   - convenzione GPA: `{ body: T[] }`
 *
 * @example
 *   readonly loader = createInMemoryLoader<Person>(this.http, '/api/v1/persons');
 *
 *   // Con filtro testo:
 *   readonly filterText = signal('');
 *   readonly loader = createInMemoryLoader<Person>(this.http, '/api/v1/persons', {
 *     filter: () => this.filterText(),
 *     filterFn: (row, text) => row.cognome.toLowerCase().includes(text.toLowerCase()),
 *   });
 *
 *   // Invalidare e ricaricare:
 *   this.loader.invalidate();
 *   this.datatable.refresh(true);
 */
export function createInMemoryLoader<T>(
  http: HttpClient,
  url: string,
  options?: InMemoryLoaderOptions<T>,
): DatatableLoader<T> & { invalidate(): void } {
  let cache: T[] | null = null;

  const fetchAll = (): Observable<T[]> => {
    if (cache !== null) return of(cache);
    return http.get<T[] | { body: T[] }>(url, {
      params: { ...(options?.extraParams?.() ?? {}) },
    }).pipe(
      map(resp => {
        const data: T[] = Array.isArray(resp) ? resp : ((resp as { body: T[] }).body ?? []);
        cache = data;
        return data;
      }),
    );
  };

  const defaultFilterFn = (row: T, text: string): boolean => {
    const lower = text.toLowerCase();
    return Object.values(row as object).some(
      v => v != null && String(v).toLowerCase().includes(lower),
    );
  };

  const loader = (page: number, pageSize: number, sort?: DatatableSort): Observable<DatatableResult<T>> => {
    return fetchAll().pipe(
      map(all => {
        // --- filtro ---
        const filterText = options?.filter?.() ?? '';
        let filtered = all;
        if (filterText) {
          const fn = options?.filterFn ?? defaultFilterFn;
          filtered = all.filter(row => fn(row, filterText));
        }

        // --- sort ---
        if (sort) {
          filtered = [...filtered].sort((a, b) => {
            const av = getNestedValue(a, sort.field);
            const bv = getNestedValue(b, sort.field);
            const cmp = compareValues(av, bv);
            return sort.dir === 'asc' ? cmp : -cmp;
          });
        }

        // --- paginazione ---
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const items = filtered.slice(start, start + pageSize);

        return { items, total };
      }),
    );
  };

  loader.invalidate = (): void => {
    cache = null;
  };

  return loader;
}

// ---------------------------------------------------------------------------

function getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce(
    (o: unknown, k) => (o != null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
