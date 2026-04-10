import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { SystemService } from './system.service';

export const contextInterceptor: HttpInterceptorFn = (req, next) => {
  const system = inject(SystemService);
  const headers: Record<string, string> = { 'X-Context': window.location.href };
  const appId = system.environmentSig()?.appId;
  if (appId) headers['X-AppId'] = appId;
  return next(req.clone({ setHeaders: headers }));
};
