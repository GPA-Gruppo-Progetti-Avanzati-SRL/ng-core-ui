
import {EnvironmentProviders, makeEnvironmentProviders,InjectionToken} from '@angular/core';


export const LIB_APP_ID = new InjectionToken<string>('LIB_APP_ID');
export const LIB_APP_SHA = new InjectionToken<string>('LIB_APP_SHA');
export const LIB_APP_VERSION = new InjectionToken<string>('LIB_APP_VERSION');
export const LIB_TOKEN_URL = new InjectionToken<string>('LIB_TOKEN_URL', { factory: () => '/api/token' });
export const LIB_ENVIRONMENT_URL = new InjectionToken<string>('LIB_ENVIRONMENT_URL', { factory: () => '/environment/environment.json' });

export interface GpaCoreOptions {
  tokenUrl?: string;
  environmentUrl?: string;
}

export function provideGPAUICore(AppId: string, AppSha: string, AppVersion: string, options?: GpaCoreOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: LIB_APP_ID, useValue: AppId },
    { provide: LIB_APP_VERSION, useValue: AppVersion },
    { provide: LIB_APP_SHA, useValue: AppSha },
    ...(options?.tokenUrl ? [{ provide: LIB_TOKEN_URL, useValue: options.tokenUrl }] : []),
    ...(options?.environmentUrl ? [{ provide: LIB_ENVIRONMENT_URL, useValue: options.environmentUrl }] : []),
  ]);
}
