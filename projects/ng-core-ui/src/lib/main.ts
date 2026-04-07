
import {EnvironmentProviders, makeEnvironmentProviders, InjectionToken} from '@angular/core';




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
  ]);
}
