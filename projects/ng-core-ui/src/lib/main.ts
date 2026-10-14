import { EnvironmentProviders, makeEnvironmentProviders, InjectionToken } from '@angular/core';
import { withInterceptors, provideHttpClient } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { contextInterceptor } from './system/context-interceptor';
import { redirectInterceptor } from './system/redirect.interceptor';
import { loadingInterceptor } from './system/loading.interceptor';
import { GpaPaginatorIntl } from './system/gpa-paginator-intl';
import { GpaDateAdapter } from './system/gpa-date-adapter';
import { LIB_TRUSTED_ORIGINS } from './system/origin';

export { LIB_TRUSTED_ORIGINS } from './system/origin';
export { GpaDateAdapter, toIsoDate } from './system/gpa-date-adapter';

export const LIB_TOKEN_URL = new InjectionToken<string>('LIB_TOKEN_URL', { factory: () => '/api/token' });
export const LIB_ENVIRONMENT_URL = new InjectionToken<string>('LIB_ENVIRONMENT_URL', { factory: () => '/environment/environment.json' });

export interface GpaCoreOptions {
  tokenUrl?: string;
  environmentUrl?: string;
  /**
   * Origin, oltre a quello della pagina, che ricevono X-Context/X-AppId e il reload su status 0
   * (es. `['https://api.example.it']`). Default: solo l'origin della pagina.
   */
  trustedOrigins?: string[];
}

export function provideGPAUICore(options?: GpaCoreOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...(options?.tokenUrl ? [{ provide: LIB_TOKEN_URL, useValue: options.tokenUrl }] : []),
    ...(options?.environmentUrl ? [{ provide: LIB_ENVIRONMENT_URL, useValue: options.environmentUrl }] : []),
    ...(options?.trustedOrigins ? [{ provide: LIB_TRUSTED_ORIGINS, useValue: options.trustedOrigins }] : []),
    provideHttpClient(withInterceptors([contextInterceptor, redirectInterceptor, loadingInterceptor])),
    { provide: MatPaginatorIntl, useClass: GpaPaginatorIntl },
    { provide: MAT_DATE_LOCALE, useValue: 'it' },
    { provide: DateAdapter, useClass: GpaDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ]);
}
