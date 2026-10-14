import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { EMPTY, catchError, throwError } from 'rxjs';
import { LIB_TRUSTED_ORIGINS, isTrustedUrl } from './origin';

/** Chiave sessionStorage con il timestamp dell'ultimo reload fatto dall'interceptor. */
const RELOAD_KEY = 'gpa-core:redirect-reload';
/** Entro questa finestra un secondo status 0 non ricarica più: l'errore arriva al chiamante. */
export const RELOAD_WINDOW_MS = 10_000;

/** Punti di estensione per i test (window.location.reload non è spiabile). */
export const _redirectInternals = {
  reload: (): void => window.location.reload(),
  now: (): number => Date.now(),
};

/**
 * Registra un reload e ritorna true solo se nella finestra RELOAD_WINDOW_MS non ce n'è già stato
 * uno. Senza sessionStorage non ricarica: senza memoria fra un caricamento e l'altro si andrebbe
 * in loop.
 */
function claimReload(): boolean {
  try {
    const now = _redirectInternals.now();
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (now - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

/**
 * Gestisce i redirect (es. 302 emessi dal proxy davanti al frontdoor su
 * sessione scaduta / login SSO) che il browser segue automaticamente sulle XHR.
 *
 * Quando il browser segue un 302 verso un altro origin (es. SSO) che non abilita
 * CORS, la XHR fallisce con status 0 e l'URL di destinazione non è leggibile
 * lato JS. In questo caso ricarichiamo la pagina con window.location.reload():
 * la navigazione top-level NON è soggetta a CORS, quindi il browser segue
 * liberamente il 302 fino all'SSO.
 *
 * Lo status 0 però arriva anche con rete assente, backend giù o CORS fallita verso servizi terzi.
 * Per non ricaricare in loop il reload avviene solo se:
 * - la richiesta è verso l'origin della pagina o un `trustedOrigins`;
 * - il browser non è offline;
 * - non c'è già stato un reload negli ultimi RELOAD_WINDOW_MS.
 * Negli altri casi l'errore viene propagato (e al bootstrap compare `page-error`).
 */
export const redirectInterceptor: HttpInterceptorFn = (req, next) => {
  const trustedOrigins = inject(LIB_TRUSTED_ORIGINS);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (
        err.status === 0 &&
        navigator.onLine !== false &&
        isTrustedUrl(req.url, trustedOrigins) &&
        claimReload()
      ) {
        _redirectInternals.reload();
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
