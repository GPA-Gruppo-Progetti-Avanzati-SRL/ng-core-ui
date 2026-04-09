
import { HttpInterceptorFn } from '@angular/common/http';


export const contextInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ setHeaders: { 'X-Context': window.location.href } }));
};
