import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { DatatableLoader, DatatableSort } from './datatable.component';

/**
 * Crea un DatatableLoader per le API GPA che seguono la convenzione:
 *   GET <url>?page=N&pageSize=M
 *   Response body:   { body: T[] }
 *   Response header: total-elements: <count>
 *
 * @param http         HttpClient da iniettare nel componente chiamante
 * @param url          URL dell'endpoint (es. '/api/v1/persons')
 * @param extraParams  Parametri aggiuntivi (filtri) come segnale o oggetto statico
 *
 * @example
 *   readonly loader = createPagedLoader<Person>(this.http, '/api/v1/persons');
 *
 *   // Con filtri dinamici:
 *   readonly loader = createPagedLoader<Person>(
 *     this.http, '/api/v1/persons',
 *     () => ({ luogodiNascita: this.filterSig() }),
 *   );
 */
export function createPagedLoader<T>(
  http: HttpClient,
  url: string,
  extraParams?: () => Record<string, string | number>,
): DatatableLoader<T> {
  return (page: number, pageSize: number, sort?: DatatableSort) => {
    const sortParams: Record<string, string> = sort
      ? { sort: `${sort.field}:${sort.dir}` }
      : {};
    return http.get<{ body: T[] }>(url, {
      params: { page, pageSize, ...(extraParams?.() ?? {}), ...sortParams },
      observe: 'response',
    }).pipe(
      map(resp => ({
        items: resp.body?.body ?? [],
        total: parseInt(resp.headers.get('total-elements') ?? '0', 10),
      })),
    );
  };
}
