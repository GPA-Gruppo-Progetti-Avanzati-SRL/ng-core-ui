import { InjectionToken } from '@angular/core';

export const LIB_TOKEN_URL = new InjectionToken<string>('LIB_TOKEN_URL', { factory: () => '/api/token' });
export const LIB_ENVIRONMENT_URL = new InjectionToken<string>('LIB_ENVIRONMENT_URL', { factory: () => '/environment/environment.json' });
/** Timeout (ms) di ciascuna chiamata del bootstrap (environment, token). */
export const LIB_BOOTSTRAP_TIMEOUT = new InjectionToken<number>('LIB_BOOTSTRAP_TIMEOUT', { factory: () => 30_000 });
