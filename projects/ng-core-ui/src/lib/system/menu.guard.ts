import {inject, Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {SystemService} from './system.service';


@Injectable({ providedIn: 'root' })
export class MenuGuard implements CanActivateChild {


  private system: SystemService = inject(SystemService);
  private router: Router = inject(Router);



  async canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {

    const path = this.system.normalizePath(state.url);

    // Consenti sempre le pagine di servizio per evitare loop
    if (path === '/forbidden' || path === '/not-found' || path === '/error') return true;

    // Attende il completamento del bootstrap (la promise è già avviata da SystemService)
    await this.system.bootstrap().catch(() => void 0);

    // Bootstrap fallito → /error
    if (this.system.layoutState() === 'error') {
      return this.router.parseUrl('/error');
    }

    const allowed = this.system.allowedEndpoints();

    // Se l'URL è la root '', normalizzato a '/', controlla se '/' o '' è consentito
    const isRoot = path === '/';

    // Ricostruisce il path template (con placeholder :param) dalla catena di snapshot
    // per matchare rotte con parametri dinamici (es. /items/edit/:id)
    const templatePath = this.getTemplateUrl(childRoute);

    const isAllowed = allowed.has(path) || allowed.has(templatePath) || (isRoot && (allowed.has('') || allowed.has('/')));

    if (isAllowed) {
      return true;
    }
    // Non consentito (rotta esiste ma non è permessa) => 403 Forbidden interno al layout
    return this.router.parseUrl('/forbidden');
  }

  private getTemplateUrl(route: ActivatedRouteSnapshot): string {
    const chain: ActivatedRouteSnapshot[] = [];
    let r: ActivatedRouteSnapshot | null = route;
    while (r) {
      chain.unshift(r);
      r = r.parent;
    }
    const parts: string[] = [];
    for (const snap of chain) {
      if (snap.routeConfig?.path) {
        parts.push(snap.routeConfig.path);
      }
    }
    return this.system.normalizePath('/' + parts.join('/'));
  }
}
