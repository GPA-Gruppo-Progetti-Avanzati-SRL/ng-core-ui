import { TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastComponent', () => {
  it('con isHtml mantiene la formattazione ma rimuove script e handler (XSS)', () => {
    TestBed.configureTestingModule({ imports: [ToastComponent] });
    const fixture = TestBed.createComponent(ToastComponent);
    document.body.appendChild(fixture.nativeElement);
    const pwned = jasmine.createSpy('pwned');
    (window as unknown as { __pwned: () => void }).__pwned = pwned;

    TestBed.inject(ToastService).error(
      '<b>Errore</b> <img src="x" onerror="window.__pwned()"><script>window.__pwned()</script>',
      -1,
      true,
    );
    fixture.detectChanges();

    const html = (fixture.nativeElement as HTMLElement).querySelector('.leading-snug')!.innerHTML;
    expect(html).toContain('<b>Errore</b>');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script');
    expect(pwned).not.toHaveBeenCalled();
    fixture.nativeElement.remove();
  });
});
