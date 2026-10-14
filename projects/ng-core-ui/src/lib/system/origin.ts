import { InjectionToken } from '@angular/core';

/**
 * Origin aggiuntivi (oltre a quello della pagina) considerati "propri": ricevono gli header
 * X-Context/X-AppId e, su status 0, fanno scattare il reload verso l'SSO.
 * Valorizzato da `provideGPAUICore({ trustedOrigins })`.
 */
export const LIB_TRUSTED_ORIGINS = new InjectionToken<readonly string[]>('LIB_TRUSTED_ORIGINS', {
  factory: () => [],
});

function originOf(url: string, base?: string): string | null {
  try {
    return new URL(url, base).origin;
  } catch {
    return null;
  }
}

/** true se `url` (relativo o assoluto) punta all'origin della pagina o a uno di `trustedOrigins`. */
export function isTrustedUrl(url: string, trustedOrigins: readonly string[] = []): boolean {
  const origin = originOf(url, window.location.href);
  if (!origin) return false;
  if (origin === window.location.origin) return true;
  return trustedOrigins.some(o => originOf(o) === origin);
}
