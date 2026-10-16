import { TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

/** Il testo del toast non deve mai uscire dal riquadro (24rem). */
describe('ToastComponent overflow', () => {
  const LONG_WORD = 'ERR_' + 'X'.repeat(120);
  const LONG_URL = 'https://api.example.it/v1/pratiche/' + 'a1b2c3d4'.repeat(15) + '?filtro=tutto';
  const cases: [string, string, boolean][] = [
    ['parola lunga senza spazi', LONG_WORD, false],
    ['URL lungo', LONG_URL, false],
    ['HTML con parola lunga', `<b>Errore:</b> ${LONG_WORD}`, true],
    ['HTML <pre> con riga lunga', `<pre>${'riga '.repeat(5)}${LONG_WORD}</pre>`, true],
    ['HTML con style rimosso dal sanitizer', `<div style="white-space:pre-wrap;word-break:break-all">${LONG_WORD}</div>`, true],
    ['HTML <table> larga', `<table><tr>${'<td>colonna-molto-larga</td>'.repeat(8)}</tr></table>`, true],
  ];

  for (const [name, message, isHtml] of cases) {
    it(name, () => {
      TestBed.configureTestingModule({ imports: [ToastComponent] });
      const fixture = TestBed.createComponent(ToastComponent);
      document.body.classList.add('ui');
      document.body.appendChild(fixture.nativeElement);
      TestBed.inject(ToastService).error(message, -1, isHtml);
      fixture.detectChanges();

      const card = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.rounded-xl')!;
      const text = card.querySelector<HTMLElement>('.leading-snug')!;
      const cardRight = card.getBoundingClientRect().right;
      const overflowing = [text, ...Array.from(text.querySelectorAll<HTMLElement>('*'))]
        .filter(el => el.getBoundingClientRect().right > cardRight + 1 && el.scrollWidth > el.clientWidth + 1);
      expect(card.scrollWidth).withContext('card scrollWidth vs clientWidth').toBeLessThanOrEqual(card.clientWidth + 1);
      expect(text.getBoundingClientRect().right).withContext('testo oltre il bordo').toBeLessThanOrEqual(cardRight + 1);
      expect(overflowing.length).withContext('figli che escono').toBe(0);
      fixture.nativeElement.remove();
    });
  }
});
