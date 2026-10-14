import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SystemService } from './system.service';
import { LIB_TRUSTED_ORIGINS, isTrustedUrl } from './origin';

/**
 * Aggiunge X-Context (URL della pagina) e X-AppId alle sole richieste verso l'origin della
 * pagina o un `trustedOrigins`: verso host terzi l'URL uscirebbe dal perimetro e l'header custom
 * provocherebbe un preflight CORS.
 */
export const contextInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isTrustedUrl(req.url, inject(LIB_TRUSTED_ORIGINS))) return next(req);
  const system = inject(SystemService);
  const headers: Record<string, string> = { 'X-Context': window.location.href };
  const appId = system.environment()?.appId;
  if (appId) headers['X-AppId'] = appId;
  return next(req.clone({ setHeaders: headers }));
};
