import { EnvironmentProviders, makeEnvironmentProviders, InjectionToken } from '@angular/core';
import { withInterceptors, provideHttpClient } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { contextInterceptor } from './system/context-interceptor';
import { loadingInterceptor } from './system/loading.interceptor';
import { GpaPaginatorIntl } from './system/gpa-paginator-intl';

export const LIB_TOKEN_URL = new InjectionToken<string>('LIB_TOKEN_URL', { factory: () => '/api/token' });
export const LIB_ENVIRONMENT_URL = new InjectionToken<string>('LIB_ENVIRONMENT_URL', { factory: () => '/environment/environment.json' });

export interface GpaCoreOptions {
  tokenUrl?: string;
  environmentUrl?: string;
}

export function provideGPAUICore(options?: GpaCoreOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...(options?.tokenUrl ? [{ provide: LIB_TOKEN_URL, useValue: options.tokenUrl }] : []),
    ...(options?.environmentUrl ? [{ provide: LIB_ENVIRONMENT_URL, useValue: options.environmentUrl }] : []),
    provideHttpClient(withInterceptors([contextInterceptor, loadingInterceptor])),
    { provide: MatPaginatorIntl, useClass: GpaPaginatorIntl },
    { provide: MAT_DATE_LOCALE, useValue: 'it' },
    provideNativeDateAdapter(),
  ]);
}
