import { TestBed } from '@angular/core/testing';
import { HttpBackend, HttpClient, HttpInterceptorFn, FetchBackend, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { provideGPAUICore } from './main';
import { SystemService } from './system/system.service';

const systemStub = { environment: signal({ appId: 'demo' }), bootstrap: () => Promise.resolve() };

const appInterceptor: HttpInterceptorFn = (req, next) => next(req.clone({ setHeaders: { 'X-App': '1' } }));

describe('provideGPAUICore + provideHttpClient dell\'app', () => {
  for (const order of ['app prima', 'gpa prima']) {
    it(`withFetch dell'app resta attivo (${order})`, () => {
      const app = provideHttpClient(withFetch());
      TestBed.configureTestingModule({
        providers: [
          ...(order === 'app prima' ? [app, provideGPAUICore()] : [provideGPAUICore(), app]),
          { provide: SystemService, useValue: systemStub },
        ],
      });
      expect(TestBed.inject(HttpBackend)).toBeInstanceOf(FetchBackend);
    });

    it(`interceptor dell'app e della libreria girano entrambi (${order})`, () => {
      const app = provideHttpClient(withInterceptors([appInterceptor]));
      TestBed.configureTestingModule({
        providers: [
          ...(order === 'app prima' ? [app, provideGPAUICore()] : [provideGPAUICore(), app]),
          provideHttpClientTesting(),
          { provide: SystemService, useValue: systemStub },
        ],
      });
      TestBed.inject(HttpClient).get('/api/x').subscribe();
      const req = TestBed.inject(HttpTestingController).expectOne('/api/x');
      expect(req.request.headers.get('X-App')).toBe('1');
      expect(req.request.headers.get('X-AppId')).toBe('demo');
      req.flush({});
    });
  }
});
