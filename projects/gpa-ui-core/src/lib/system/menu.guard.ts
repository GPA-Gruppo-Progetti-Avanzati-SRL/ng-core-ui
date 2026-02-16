import { Injectable, inject } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { SystemService } from './system.service';

@Injectable({ providedIn: 'root' })
export class MenuGuard implements CanActivateChild {
  private system = inject(SystemService);
  private router = inject(Router);

  async canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    // Assicura che i dati base siano caricati almeno una volta
    if (!this.system.whoamiSig() || this.system.menuTreeSig() === null) {
      await this.system.bootstrap().catch(() => void 0);
    }

    const path = this.system.normalizePath(state.url);

    // Consenti sempre le pagine di servizio per evitare loop
    if (path === '/forbidden' || path === '/not-found') return true;

    const allowed = this.system.allowedEndpoints();

    // Se l'URL è la root '', normalizzato a '/', controlla se '/' o '' è consentito
    const isRoot = path === '/';
    const isAllowed = allowed.has(path) || (isRoot && (allowed.has('') || allowed.has('/')));

    if (isAllowed) {
      return true;
    }
    // Non consentito (rotta esiste ma non è permessa) => 403 Forbidden interno al layout
    return this.router.parseUrl('/forbidden');
  }
}
