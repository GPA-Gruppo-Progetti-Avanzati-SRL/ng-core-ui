import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { MenuGuard } from './menu.guard';
import { SystemService } from './system.service';

describe('MenuGuard', () => {
  let guard: MenuGuard;
  let router: Router;
  const layoutState = signal<'loading' | 'ready' | 'error'>('ready');

  beforeEach(() => {
    layoutState.set('ready');
    const real = { normalizePath: SystemService.prototype.normalizePath };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: SystemService,
          useValue: {
            bootstrap: () => Promise.resolve(),
            layoutState,
            allowedEndpoints: computed(() => new Set(['/', '/users', '/items/edit/:id'])),
            normalizePath: real.normalizePath,
          },
        },
      ],
    });
    guard = TestBed.inject(MenuGuard);
    router = TestBed.inject(Router);
  });

  /** Catena di snapshot parent('') → child(path) come la costruisce toRoutes(). */
  function child(path: string): ActivatedRouteSnapshot {
    const parent = { routeConfig: { path: '' }, parent: null } as unknown as ActivatedRouteSnapshot;
    return { routeConfig: { path }, parent } as unknown as ActivatedRouteSnapshot;
  }
  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  const target = (r: boolean | UrlTree) => (r === true ? true : router.serializeUrl(r as UrlTree));

  it('URL sconosciuto (rotta **) → passa, così si vede la 404 e non /forbidden', async () => {
    expect(target(await guard.canActivateChild(child('**'), state('/non-esiste')))).toBeTrue();
  });

  it('rotta esistente non consentita → /forbidden', async () => {
    expect(target(await guard.canActivateChild(child('admin'), state('/admin')))).toBe('/forbidden');
  });

  it('rotta consentita, anche con parametri dinamici e query string', async () => {
    expect(target(await guard.canActivateChild(child('users'), state('/users?page=2')))).toBeTrue();
    expect(target(await guard.canActivateChild(child('items/edit/:id'), state('/items/edit/42')))).toBeTrue();
  });

  it('bootstrap fallito → lascia passare: il layout mostra la pagina di errore e l\'URL resta', async () => {
    layoutState.set('error');
    expect(target(await guard.canActivateChild(child('users'), state('/users')))).toBeTrue();
  });
});
