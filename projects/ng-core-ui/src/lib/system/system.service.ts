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

  readonly whoami        = signal<{ user: string; roles: string[] | null; capabilities: string[] | null } | null>(null);
  readonly paths         = signal<PathNode[] | null>(null);
  readonly menuTree      = computed(() => {
    const p = this.paths();
    return p === null ? null : this._sortByOrder(p.filter(n => n.menu));
  });
  readonly apps          = signal<App[] | null>(null);
  readonly sites         = signal<Site[] | null>(null);
  readonly environment   = signal<Environment | null>(null);
  readonly environmentProperties = computed(() => this.environment()?.properties ?? {});

  private readonly _bootstrapFailed = signal(false);
  readonly layoutState = computed<'loading' | 'ready' | 'error'>(() => {
    if (this._bootstrapFailed()) return 'error';
    if (this.whoami())           return 'ready';
    return 'loading';
  });

  private readonly capabilitiesSet = computed(() =>
    new Set(this.whoami()?.capabilities ?? [])
  );

  readonly allowedEndpoints = computed(() => {
    const list = this.paths();
    if (!list) return new Set<string>();
    const acc = new Set<string>();
    for (const n of list) {
      if (n.endpoint) acc.add(this.normalizePath(n.endpoint));
    }
    return acc;
  });

  constructor() {
    effect(() => {
      const env = this.environment();
      if (!env) return;
      this.styleManager.setTheme(env.theme);
      if (isDevMode()) console.log('[SystemService] theme →', env.theme);
    });

    effect(() => {
      switch (this.layoutState()) {
        case 'loading': this.titleService.setTitle('Caricamento...'); break;
        case 'error':   this.titleService.setTitle('Errore');         break;
        case 'ready': {
          const title = this.environment()?.appTitle;
          if (title) this.titleService.setTitle(title);
          break;
        }
      }
    });

    // Differito a dopo la risoluzione del grafo DI (evita ciclo SystemService → HttpClient → contextInterceptor → SystemService)
    queueMicrotask(() => this.bootstrap().catch(() => this._bootstrapFailed.set(true)));
  }

  getEnvironmentProperty(key: string): unknown {
    return this.environmentProperties()[key];
  }

  canDo(action: CoreAction | string): boolean {
    const id = typeof action === 'string' ? action : action.id;
    console.log("id:"+id)
    return this.capabilitiesSet().has(id);
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
    this.environment.set(data);
    return data;
  }

  async loadToken(): Promise<TokenResponse> {
    const env = this.environment();
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

    this.whoami.set({ user: data.user, roles: data.roles ?? [], capabilities: data.capabilities ?? [] });
    this.paths.set(data.paths ?? []);

    this.apps.set(this._sortByOrder(data.apps ?? []));
    this.sites.set(this._sortByOrder(data.sites ?? []));

    return data;
  }

  private bootstrapPromise: Promise<void> | null = null;

  async bootstrap(): Promise<void> {
    if (this.whoami() && this.paths() && this.apps()) return;
    if (this.bootstrapPromise) return this.bootstrapPromise;
    if (isDevMode()) console.debug('[SystemService] bootstrap starting');
    this.bootstrapPromise = (async () => {
      try {
        await this.loadEnvironment();
        await this.loadToken();
        if (isDevMode()) console.debug('[SystemService] bootstrap finished');
      } catch (err) {
        console.error('[SystemService] bootstrap failed', err);
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
