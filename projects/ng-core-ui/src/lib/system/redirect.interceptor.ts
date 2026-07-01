import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { EMPTY, catchError, throwError } from 'rxjs';

/**
 * Gestisce i redirect (es. 302 emessi dal proxy davanti al frontdoor su
 * sessione scaduta / login SSO) che il browser segue automaticamente sulle XHR.
 *
 * Quando il browser segue un 302 verso un altro origin (es. SSO) che non abilita
 * CORS, la XHR fallisce con status 0 e l'URL di destinazione non è leggibile
 * lato JS. In questo caso ricarichiamo la pagina con window.location.reload():
 * la navigazione top-level NON è soggetta a CORS, quindi il browser segue
 * liberamente il 302 fino all'SSO.
 */
export const redirectInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // status 0 = errore di rete / risposta opaca: tipicamente un redirect
      // cross-origin (SSO) bloccato da CORS. Ricarica via navigazione top-level
      // (esente da CORS), così il browser segue il 302 fino alla destinazione.
      if (err.status === 0) {
        window.location.reload();
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
