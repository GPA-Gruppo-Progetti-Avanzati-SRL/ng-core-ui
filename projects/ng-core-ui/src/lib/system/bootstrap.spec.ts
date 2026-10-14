import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideGPAUICore } from '../main';
import { SystemService } from './system.service';
import { LoadingService } from './loading.service';
import { SKIP_LOADING } from './loading.interceptor';

describe('bootstrap (provideGPAUICore)', () => {
  function setup(bootstrapTimeoutMs?: number) {
    TestBed.configureTestingModule({
      providers: [provideGPAUICore({ bootstrapTimeoutMs }), provideHttpClientTesting()],
    });
    return { ctrl: TestBed.inject(HttpTestingController), system: TestBed.inject(SystemService) };
  }

  it('parte da solo con provideGPAUICore e porta layoutState a ready', async () => {
    const { ctrl, system } = setup();
    expect(system.layoutState()).toBe('loading');
    ctrl.expectOne('/environment/environment.json').flush({ appId: 'demo', appTitle: 'Demo', theme: 'gpa' });
    await Promise.resolve();
    await new Promise(r => setTimeout(r));
    ctrl.expectOne('/api/token').flush(JSON.stringify({ user: 'ada', paths: [], apps: [] }));
    await system.bootstrap();
    expect(system.layoutState()).toBe('ready');
    expect(system.whoami()?.user).toBe('ada');
  });

  it('errore HTTP → layoutState error', async () => {
    const { ctrl, system } = setup();
    ctrl.expectOne('/environment/environment.json').flush('x', { status: 503, statusText: 'Down' });
    await expectAsync(system.bootstrap()).toBeRejected();
    expect(system.layoutState()).toBe('error');
  });

  it('timeout → layoutState error invece di spinner infinito', async () => {
    const { ctrl, system } = setup(20);
    ctrl.expectOne('/environment/environment.json'); // nessuna risposta
    await expectAsync(system.bootstrap()).toBeRejected();
    expect(system.layoutState()).toBe('error');
  });

  it('iniettare SystemService senza provideGPAUICore non fa partire HTTP', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    TestBed.inject(SystemService);
    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('SKIP_LOADING esclude la richiesta dal contatore di LoadingService', async () => {
    const { ctrl } = setup();
    const loading = TestBed.inject(LoadingService);
    ctrl.expectOne('/environment/environment.json').flush('x', { status: 503, statusText: 'Down' });
    await TestBed.inject(SystemService).bootstrap().catch(() => void 0);

    TestBed.inject(HttpClient).get('/poll', { context: new HttpContext().set(SKIP_LOADING, true) }).subscribe();
    expect(loading.isLoading()).toBeFalse();
    TestBed.inject(HttpClient).get('/save').subscribe();
    expect(loading.isLoading()).toBeTrue();
  });
});
