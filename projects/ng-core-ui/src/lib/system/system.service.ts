import {Injectable, computed, inject, signal, effect} from '@angular/core';
import { HttpClient , HttpHeaders} from '@angular/common/http';
import { App, Context, PathNode, TokenResponse } from './system.models';
import { Environment } from './environment';
import { firstValueFrom } from 'rxjs';
import {LIB_APP_ID, LIB_APP_VERSION, LIB_APP_SHA, LIB_TOKEN_URL, LIB_ENVIRONMENT_URL} from '../main';
import { decrypt } from '../utils';
import { StyleManagerService } from './style-manager.service';


@Injectable({ providedIn: 'root' })
export class SystemService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly appId: string = inject(LIB_APP_ID);
  private readonly appSha: string = inject(LIB_APP_SHA);
  private readonly appVersion: string = inject(LIB_APP_VERSION);
  private readonly tokenUrl: string = inject(LIB_TOKEN_URL);
  private readonly environmentUrl: string = inject(LIB_ENVIRONMENT_URL);
  private readonly styleManager: StyleManagerService = inject(StyleManagerService);

  constructor() {
    console.log("App "+ this.appId);
    console.log("Sha "+ this.appSha);
    console.log("Version "+ this.appVersion);
    console.log("SystemService Initialized");

    // Automatically apply theme class to body when environment changes
    effect(() => {
      const theme = this.environmentSig()?.theme;
      console.log("Theme changed to: ", theme);
      this.styleManager.setTheme(theme);
    });
  }
  // Signals per stato
  readonly whoamiSig = signal<{user: string, roles: string[] | null, capabilities: string[] | null} | null>(null);
  readonly pathsSig = signal<PathNode[] | null>(null);
  readonly menuTreeSig = signal<PathNode[] | null>(null);
  readonly appsSig = signal<App[] | null>(null);
  readonly contextsSig = signal<Context[] | null>(null);
  readonly environmentSig = signal<Environment | null>(null);
  readonly environmentProperties = computed(() => this.environmentSig()?.properties || {});

  getEnvironmentProperty(key: string): unknown {
    return this.environmentProperties()[key];
  }

  // Endpoints consentiti (tutti i path ricevuti)
  readonly allowedEndpoints = computed(() => {
    const list = this.pathsSig();
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

  async loadEnvironment(): Promise<Environment> {
    const data = await firstValueFrom(this.http.get<Environment>(this.environmentUrl));
    console.debug("environment", data);
    this.environmentSig.set(data);
    return data;
  }

  async loadToken(): Promise<TokenResponse> {
    const headers = new HttpHeaders().set('AppId', this.appId);
    const encryptedToken = await firstValueFrom(this.http.get(this.tokenUrl, { headers, responseType: 'text' }));
    const decryptedJson = await decrypt(encryptedToken, this.appId);
    let data: TokenResponse;
    try {
      data = JSON.parse(decryptedJson) as TokenResponse;
    } catch {
      throw new Error('Token decryption returned invalid JSON');
    }
    console.debug("token", data);

    this.whoamiSig.set({
      user: data.user,
      roles: data.roles ?? [],
      capabilities: data.capabilities ?? []
    });
    this.pathsSig.set(data.paths ?? []);

    const menuNodes = (data.paths ?? []).filter(p => p.ismenu);
    const sortedMenu = this.sortPathNodes(menuNodes);
    this.menuTreeSig.set(sortedMenu);

    const sortedApps = this.sortApps(data.apps ?? []);
    this.appsSig.set(sortedApps);

    this.contextsSig.set(data.contexts ?? []);

    return data;
  }

  private bootstrapPromise: Promise<void> | null = null;

  async bootstrap(): Promise<void> {
    // Se i dati sono già presenti, evitiamo il ricaricamento
    if (this.whoamiSig() && this.pathsSig() && this.appsSig()) {
      return Promise.resolve();
    }

    // Se c'è già un bootstrap in corso, restituiamo la stessa promise
    if (this.bootstrapPromise) {
      return this.bootstrapPromise;
    }

    console.debug('Bootstrap starting...');
    this.bootstrapPromise = Promise.all([
      this.loadToken(),
      this.loadEnvironment()
    ]).then(() => {
      console.debug('Bootstrap finished');
    }).catch(err => {
      console.error('Bootstrap failed', err);
      this.bootstrapPromise = null; // Permetti riprovo esplicito
      throw err;
    });

    return this.bootstrapPromise;
  }

  // Ordina per 'order' crescente; elementi senza 'order' in fondo;
  // a parità di 'order' ordina alfabeticamente per description/id
  private sortPathNodes(nodes: PathNode[] | null): PathNode[] {
    if (!nodes || !nodes.length) return [];
    const toKey = (n: PathNode) => (n.id.toLowerCase());
    const getOrder = (n: PathNode) => (n.order ?? 0);

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
    const toKey = (a: App) => (a.id.toLowerCase());
    const getOrder = (a: App) => (a.order ?? 0);

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
