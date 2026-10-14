import { EnvironmentProviders, makeEnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { withInterceptors, provideHttpClient } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { contextInterceptor } from './system/context-interceptor';
import { redirectInterceptor } from './system/redirect.interceptor';
import { loadingInterceptor } from './system/loading.interceptor';
import { GpaPaginatorIntl } from './system/gpa-paginator-intl';
import { GpaDateAdapter } from './system/gpa-date-adapter';
import { LIB_TRUSTED_ORIGINS } from './system/origin';
import { LIB_LABELS, CoreLabelsOverrides } from './system/labels';
import { SystemService } from './system/system.service';
import { LIB_TOKEN_URL, LIB_ENVIRONMENT_URL, LIB_BOOTSTRAP_TIMEOUT } from './system/tokens';

export { LIB_TRUSTED_ORIGINS } from './system/origin';
export { GpaDateAdapter, toIsoDate } from './system/gpa-date-adapter';
export * from './system/labels';
export { CoreLabelsService } from './system/labels.service';
export { BUILD_INFO } from './system/build-info';
export { SKIP_LOADING } from './system/loading.interceptor';

export { LIB_TOKEN_URL, LIB_ENVIRONMENT_URL, LIB_BOOTSTRAP_TIMEOUT } from './system/tokens';

export interface GpaCoreOptions {
  tokenUrl?: string;
  environmentUrl?: string;
  /**
   * Origin, oltre a quello della pagina, che ricevono X-Context/X-AppId e il reload su status 0
   * (es. `['https://api.example.it']`). Default: solo l'origin della pagina.
   */
  trustedOrigins?: string[];
  /** Timeout in ms di ciascuna chiamata del bootstrap (environment, token). Default 30000. */
  bootstrapTimeoutMs?: number;
  /**
   * Override dei testi della libreria per lingua, es.
   * `{ it: { datatable: { empty: 'Nessuna pratica' } }, en: { … } }`.
   */
  labels?: CoreLabelsOverrides;
}

export function provideGPAUICore(options?: GpaCoreOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...(options?.tokenUrl ? [{ provide: LIB_TOKEN_URL, useValue: options.tokenUrl }] : []),
    ...(options?.environmentUrl ? [{ provide: LIB_ENVIRONMENT_URL, useValue: options.environmentUrl }] : []),
    ...(options?.trustedOrigins ? [{ provide: LIB_TRUSTED_ORIGINS, useValue: options.trustedOrigins }] : []),
    ...(options?.bootstrapTimeoutMs ? [{ provide: LIB_BOOTSTRAP_TIMEOUT, useValue: options.bootstrapTimeoutMs }] : []),
    ...(options?.labels ? [{ provide: LIB_LABELS, useValue: options.labels }] : []),
    provideHttpClient(withInterceptors([contextInterceptor, redirectInterceptor, loadingInterceptor])),
    { provide: MatPaginatorIntl, useClass: GpaPaginatorIntl },
    { provide: MAT_DATE_LOCALE, useValue: 'it' },
    { provide: DateAdapter, useClass: GpaDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    // Avvia il bootstrap senza bloccare il render (i layout mostrano lo spinner nel frattempo).
    // L'errore è già gestito da SystemService (layoutState → 'error'): qui va solo assorbito.
    provideEnvironmentInitializer(() => {
      inject(SystemService).bootstrap().catch(() => void 0);
    }),
  ]);
}
