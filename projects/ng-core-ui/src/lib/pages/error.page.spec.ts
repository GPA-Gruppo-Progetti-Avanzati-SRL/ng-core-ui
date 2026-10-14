import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ErrorPage, _errorPageInternals } from './error.page';
import { SystemService } from '../system/system.service';

describe('ErrorPage', () => {
  it('"Riprova" ricarica la pagina; senza --define mostra la versione dev', () => {
    const reload = spyOn(_errorPageInternals, 'reload');
    TestBed.configureTestingModule({
      imports: [ErrorPage],
      providers: [{ provide: SystemService, useValue: { environment: signal(null) } }],
    });
    const fixture = TestBed.createComponent(ErrorPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Servizio non disponibile');
    expect(el.textContent).toContain('dev');
    el.querySelector('button')!.click();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
