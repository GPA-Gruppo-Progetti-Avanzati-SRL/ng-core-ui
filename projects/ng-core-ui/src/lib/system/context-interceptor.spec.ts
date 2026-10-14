import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { contextInterceptor } from './context-interceptor';
import { SystemService } from './system.service';
import { LIB_TRUSTED_ORIGINS } from './origin';

describe('contextInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([contextInterceptor])),
        provideHttpClientTesting(),
        { provide: SystemService, useValue: { environment: signal({ appId: 'my-app' }) } },
        { provide: LIB_TRUSTED_ORIGINS, useValue: ['https://api.trusted.it/'] },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  function headersFor(url: string) {
    http.get(url).subscribe();
    const req = ctrl.expectOne(url);
    req.flush({});
    return req.request.headers;
  }

  it('aggiunge X-Context e X-AppId alle richieste relative', () => {
    const h = headersFor('/api/data');
    expect(h.get('X-Context')).toBe(window.location.href);
    expect(h.get('X-AppId')).toBe('my-app');
  });

  it('aggiunge gli header alle URL assolute dello stesso origin', () => {
    expect(headersFor(`${window.location.origin}/api/data`).has('X-Context')).toBeTrue();
  });

  it('aggiunge gli header a un trustedOrigin (anche con slash finale nella config)', () => {
    expect(headersFor('https://api.trusted.it/v1/x').get('X-AppId')).toBe('my-app');
  });

  it('non manda nulla verso host terzi', () => {
    const h = headersFor('https://cdn.esterno.com/lib.json');
    expect(h.has('X-Context')).toBeFalse();
    expect(h.has('X-AppId')).toBeFalse();
  });
});
