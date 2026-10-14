import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SystemService } from './system.service';

describe('SystemService', () => {
  let service: SystemService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SystemService,
      ],
    });
    service = TestBed.inject(SystemService);
  });

  it('dovrebbe inizializzare currentPageTitle con default "Enterprise App" quando environment non è presente', () => {
    expect(service.currentPageTitle()).toBe('Enterprise App');
  });

  it('dovrebbe usare environment.appTopBarTitle o environment.appDescription come currentPageTitle se disponibile', () => {
    service.environment.set({
      appId: 'test-app',
      appTitle: 'Test App Title',
      appDescription: 'Descrizione Applicazione Test',
      theme: 'gpa',
      logoutPath: '/logout',
    });
    expect(service.currentPageTitle()).toBe('Descrizione Applicazione Test');

    service.environment.set({
      appId: 'test-app',
      appTitle: 'Test App Title',
      appTopBarTitle: 'Test Top Bar',
      appDescription: 'Descrizione Applicazione Test',
      theme: 'gpa',
      logoutPath: '/logout',
    });
    expect(service.currentPageTitle()).toBe('Test Top Bar');
  });

  it('dovrebbe permettere di overridare currentPageTitle tramite setCurrentPageTitle / overrideCurrentPageTitle', () => {
    service.environment.set({
      appId: 'test-app',
      appTitle: 'Test App Title',
      appTopBarTitle: 'Test Top Bar',
      appDescription: 'Descrizione Applicazione Test',
      theme: 'gpa',
      logoutPath: '/logout',
    });

    service.setCurrentPageTitle('Titolo Pagina Personalizzato');
    expect(service.currentPageTitle()).toBe('Titolo Pagina Personalizzato');
  });

  it('dovrebbe ripristinare il titolo di default quando viene eseguito resetCurrentPageTitle o passato null', () => {
    service.environment.set({
      appId: 'test-app',
      appTitle: 'Test App Title',
      appTopBarTitle: 'Test Top Bar',
      appDescription: 'Descrizione Applicazione Test',
      theme: 'gpa',
      logoutPath: '/logout',
    });

    service.setCurrentPageTitle('Titolo Personalizzato');
    expect(service.currentPageTitle()).toBe('Titolo Personalizzato');

    service.resetCurrentPageTitle();
    expect(service.currentPageTitle()).toBe('Test Top Bar');

    service.setCurrentPageTitle('Altro Titolo');
    expect(service.currentPageTitle()).toBe('Altro Titolo');

    service.setCurrentPageTitle(null);
    expect(service.currentPageTitle()).toBe('Test Top Bar');
  });
});
