import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RELOAD_WINDOW_MS, _redirectInternals, redirectInterceptor } from './redirect.interceptor';
import { LIB_TRUSTED_ORIGINS } from './origin';

describe('redirectInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let reload: jasmine.Spy;
  let now: number;

  beforeEach(() => {
    sessionStorage.removeItem('gpa-core:redirect-reload');
    now = 1_000_000;
    spyOn(_redirectInternals, 'now').and.callFake(() => now);
    reload = spyOn(_redirectInternals, 'reload');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([redirectInterceptor])),
        provideHttpClientTesting(),
        { provide: LIB_TRUSTED_ORIGINS, useValue: ['https://api.trusted.it'] },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => sessionStorage.removeItem('gpa-core:redirect-reload'));

  /** Esegue una GET che fallisce con status 0 e ritorna l'errore propagato (o null). */
  function failWithStatus0(url: string): unknown {
    let error: unknown = null;
    http.get(url).subscribe({ error: e => (error = e) });
    ctrl.expectOne(url).error(new ProgressEvent('error'));
    return error;
  }

  it('ricarica una volta su status 0 same-origin', () => {
    expect(failWithStatus0('/api/data')).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('non ricarica di nuovo entro la finestra: propaga l\'errore (niente loop)', () => {
    failWithStatus0('/api/data');
    now += RELOAD_WINDOW_MS - 1;
    const err = failWithStatus0('/environment/environment.json');
    expect(reload).toHaveBeenCalledTimes(1);
    expect((err as { status: number }).status).toBe(0);
  });

  it('ricarica di nuovo dopo la finestra', () => {
    failWithStatus0('/api/data');
    now += RELOAD_WINDOW_MS;
    failWithStatus0('/api/data');
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('non ricarica per host terzi: propaga l\'errore', () => {
    const err = failWithStatus0('https://cdn.esterno.com/x.json');
    expect(reload).not.toHaveBeenCalled();
    expect((err as { status: number }).status).toBe(0);
  });

  it('ricarica per un trustedOrigin', () => {
    failWithStatus0('https://api.trusted.it/v1/x');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('non ricarica da offline', () => {
    spyOnProperty(navigator, 'onLine').and.returnValue(false);
    const err = failWithStatus0('/api/data');
    expect(reload).not.toHaveBeenCalled();
    expect(err).not.toBeNull();
  });

  it('propaga gli errori HTTP diversi da 0', () => {
    let error: { status: number } | null = null;
    http.get('/api/data').subscribe({ error: e => (error = e) });
    ctrl.expectOne('/api/data').flush('x', { status: 500, statusText: 'Server Error' });
    expect(reload).not.toHaveBeenCalled();
    expect(error!.status).toBe(500);
  });
});
