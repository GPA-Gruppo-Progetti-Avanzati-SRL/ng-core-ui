import { Injectable, computed, inject, signal, effect, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { App, Site, PathNode, TokenResponse } from './system.models';
import { CoreAction } from './routes';
import { Environment } from './environment';
import { firstValueFrom } from 'rxjs';
import { LIB_TOKEN_URL, LIB_ENVIRONMENT_URL } from '../main';
import { decrypt } from '../utils';
import { StyleManagerService } from './style-manager.service';

@Injectable({ providedIn: 'root' })
export class SystemService {
  private readonly http             = inject(HttpClient);
  private readonly tokenUrl         = inject(LIB_TOKEN_URL);
  private readonly environmentUrl   = inject(LIB_ENVIRONMENT_URL);
  private readonly styleManager     = inject(StyleManagerService);
  private readonly titleService     = inject(Title);

  readonly whoamiSig        = signal<{ user: string; roles: string[] | null; capabilities: string[] | null } | null>(null);
  readonly pathsSig         = signal<PathNode[] | null>(null);
  readonly menuTreeSig      = signal<PathNode[] | null>(null);
  readonly appsSig          = signal<App[] | null>(null);
  readonly sitesSig         = signal<Site[] | null>(null);
  readonly environmentSig   = signal<Environment | null>(null);
  readonly environmentProperties = computed(() => this.environmentSig()?.properties ?? {});

  private readonly capabilitiesSet = computed(() =>
    new Set(this.whoamiSig()?.capabilities ?? [])
  );

  readonly allowedEndpoints = computed(() => {
    const list = this.pathsSig();
    if (!list) return new Set<string>();
    const acc = new Set<string>();
    for (const n of list) {
      if (n.endpoint) acc.add(this.normalizePath(n.endpoint));
    }
    return acc;
  });

  constructor() {
    effect(() => {
      const env = this.environmentSig();
      this.styleManager.setTheme(env?.theme);
      if (env?.appTitle) this.titleService.setTitle(env.appTitle);
      if (isDevMode()) console.log('[SystemService] theme →', env?.theme);
    });
  }

  getEnvironmentProperty(key: string): unknown {
    return this.environmentProperties()[key];
  }

  canDo(action: CoreAction | string): boolean {
    const appId = this.environmentSig()?.appId ?? '';
    const id = typeof action === 'string' ? action : action.id;
    return this.capabilitiesSet().has(`${appId}-${id}`.toUpperCase());
  }

  normalizePath(path: string): string {
    try {
      const url = new URL(path, 'http://');
      return url.pathname.endsWith('/') && url.pathname !== '/' ? url.pathname.slice(0, -1) : url.pathname;
    } catch {
      const p = path.startsWith('/') ? path : `/${path}`;
      return p.endsWith('/') && p !== '/' ? p.slice(0, -1) : p;
    }
  }

  async loadEnvironment(): Promise<Environment> {
    const data = await firstValueFrom(this.http.get<Environment>(this.environmentUrl));
    if (isDevMode()) console.debug('[SystemService] environment', data);
    this.environmentSig.set(data);
    return data;
  }

  async loadToken(): Promise<TokenResponse> {
    const env = this.environmentSig();
    if (!env?.appId) throw new Error('AppId not found in environment');

    const headers = new HttpHeaders().set('AppId', env.appId);
    const rawToken = await firstValueFrom(this.http.get(this.tokenUrl, { headers, responseType: 'text' }));
    const decryptedJson = env.encryptToken ? await decrypt(rawToken, env.appId) : rawToken;

    let data: TokenResponse;
    try {
      data = JSON.parse(decryptedJson) as TokenResponse;
    } catch {
      throw new Error('Token decryption returned invalid JSON');
    }
    if (isDevMode()) console.debug('[SystemService] token', data);

    this.whoamiSig.set({ user: data.user, roles: data.roles ?? [], capabilities: data.capabilities ?? [] });
    this.pathsSig.set(data.paths ?? []);
    this.menuTreeSig.set(this._sortByOrder(data.paths?.filter(p => p.menu) ?? []));
    this.appsSig.set(this._sortByOrder(data.apps ?? []));
    this.sitesSig.set(this._sortByOrder(data.sites ?? []));

    return data;
  }

  private bootstrapPromise: Promise<void> | null = null;

  async bootstrap(): Promise<void> {
    if (this.whoamiSig() && this.pathsSig() && this.appsSig()) return;
    if (this.bootstrapPromise) return this.bootstrapPromise;

    if (isDevMode()) console.debug('[SystemService] bootstrap starting');
    this.bootstrapPromise = (async () => {
      try {
        await this.loadEnvironment();
        await this.loadToken();
        if (isDevMode()) console.debug('[SystemService] bootstrap finished');
      } catch (err) {
        console.error('[SystemService] bootstrap failed', err);
        this.bootstrapPromise = null;
        throw err;
      }
    })();

    return this.bootstrapPromise;
  }

  private _sortByOrder<T extends { id: string; order?: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const od = (a.order ?? 0) - (b.order ?? 0);
      return od !== 0 ? od : a.id.toLowerCase().localeCompare(b.id.toLowerCase());
    });
  }
}
