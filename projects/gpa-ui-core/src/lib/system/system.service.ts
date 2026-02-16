import { Injectable, computed, inject, signal, InjectionToken } from '@angular/core';
import { HttpClient , HttpHeaders} from '@angular/common/http';
import { App, MenuNode, WhoamiBodyResponse } from './system.models';
import { firstValueFrom } from 'rxjs';
import { LIB_APP_ID } from '../tokens';

@Injectable({ providedIn: 'root' })
export class SystemService {
  private http = inject(HttpClient);
  private appId = inject(LIB_APP_ID);

  // Signals per stato
  readonly whoamiSig = signal<WhoamiBodyResponse | null>(null);
  readonly menuTreeSig = signal<MenuNode[] | null>(null);
  readonly appsSig = signal<App[] | null>(null);

  // Endpoints consentiti (derivati dal menu)
  readonly allowedEndpoints = computed(() => {
    const list = this.menuTreeSig();
    if (!list) return new Set<string>();
    const acc = new Set<string>();
    for (const n of list) {
      if (n.path) acc.add(this.normalizePath(n.path));
    }
    return acc;
  });

  normalizePath(path: string): string {
    // Normalizza a '/segment' senza query/hash
    try {
      // rimuove origin se presente
      const url = new URL(path, 'http://');
      return url.pathname.endsWith('/') && url.pathname !== '/' ? url.pathname.slice(0, -1) : url.pathname;
    } catch {
      // non è URL pieno; assicurarsi prefisso '/'
      const p = path.startsWith('/') ? path : `/${path}`;
      return p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p;
    }
  }

  async loadWhoami(): Promise<WhoamiBodyResponse> {
    const headers = new HttpHeaders().set('AppId', this.appId);
    const data = await firstValueFrom(this.http.get<WhoamiBodyResponse>('/api/whoami', { headers }));
    this.whoamiSig.set(data);
    return data;
  }

  async loadMenu(): Promise<MenuNode[] | null> {
    const headers = new HttpHeaders().set('AppId', this.appId);
    const data = await firstValueFrom(this.http.get<MenuNode[] | null>('/api/menu', { headers }));
    const sorted = this.sortMenuTree(data ?? []);
    this.menuTreeSig.set(sorted);
    return sorted;
  }

  async loadApps(): Promise<App[] | null> {
    const data = await firstValueFrom(this.http.get<App[] | null>('/api/apps'));
    const sorted = this.sortApps(data ?? []);
    this.appsSig.set(sorted);
    return sorted;
  }

  private bootstrapPromise: Promise<void> | null = null;

  async bootstrap(): Promise<void> {
    if (this.bootstrapPromise) {
      return this.bootstrapPromise;
    }

    // Se i dati sono già presenti, evitiamo il ricaricamento (opzionale, ma consigliato se bootstrap è idempotent)
    if (this.whoamiSig() && this.menuTreeSig() && this.appsSig()) {
      return Promise.resolve();
    }

    console.debug('Bootstrap starting...');
    this.bootstrapPromise = Promise.allSettled([
      this.loadWhoami(),
      this.loadMenu(),
      this.loadApps()
    ]).then(() => {
      console.debug('Bootstrap finished');
      // Non azzeriamo il promise se vogliamo che chiamate successive riutilizzino lo stesso risultato "già fatto"
      // Se invece vogliamo permettere un re-bootstrap futuro, potremmo volerlo azzerare in certe condizioni.
      // Per ora lo teniamo per evitare chiamate multiple durante l'init.
    });

    return this.bootstrapPromise;
  }

  // Ordina per 'order' crescente; elementi senza 'order' in fondo;
  // a parità di 'order' ordina alfabeticamente per description/id
  private sortMenuTree(nodes: MenuNode[] | null): MenuNode[] {
    if (!nodes || !nodes.length) return [];
    const toKey = (n: MenuNode) => (n.description?.toLowerCase() || n.id.toLowerCase());
    const getOrder = (n: MenuNode) => (n.order ?? Number.POSITIVE_INFINITY);

    return [...nodes].sort((a, b) => {
      const ao = getOrder(a);
      const bo = getOrder(b);
      if (ao !== bo) return ao - bo;
      const ak = toKey(a);
      const bk = toKey(b);
      return ak.localeCompare(bk);
    });
  }

  private sortApps(apps: App[] | null): App[] {
    if (!apps || !apps.length) return [];
    const toKey = (a: App) => (a.description?.toLowerCase() || a.id.toLowerCase());
    const getOrder = (a: App) => (a.order ?? Number.POSITIVE_INFINITY);

    return [...apps].sort((a, b) => {
      const ao = getOrder(a);
      const bo = getOrder(b);
      if (ao !== bo) return ao - bo;
      const ak = toKey(a);
      const bk = toKey(b);
      return ak.localeCompare(bk);
    });
  }
}
