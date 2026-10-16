import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmService } from './confirm.service';
import { AlertService } from '../alert.component/alert.service';

describe('ConfirmService / AlertService (MatDialog)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  const panes = () => Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-pane.core-dialog'));
  const settle = async () => {
    TestBed.tick();
    await new Promise(r => setTimeout(r));
    TestBed.tick();
  };
  const button = (pane: HTMLElement, label: string) =>
    Array.from(pane.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent!.trim() === label)!;

  it('due confirm aperti insieme risolvono ciascuno la propria Promise', async () => {
    const svc = TestBed.inject(ConfirmService);
    const first = svc.confirm({ message: 'Primo?' });
    const second = svc.confirm({ message: 'Secondo?', confirmLabel: 'Sì' });
    await settle();
    expect(panes().length).toBe(2);

    button(panes()[1], 'Sì').click();
    await settle();
    button(panes()[0], 'Annulla').click();
    await settle();

    await expectAsync(second).toBeResolvedTo(true);
    await expectAsync(first).toBeResolvedTo(false);
  });

  it('Esc chiude il confirm con false', async () => {
    const result = TestBed.inject(ConfirmService).confirm({ message: 'Esci?' });
    await settle();
    const container = panes()[0].querySelector<HTMLElement>('mat-dialog-container')!;
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    await settle();
    await expectAsync(result).toBeResolvedTo(false);
  });

  it('confirm ha role=dialog, aria-labelledby sul titolo e bottone rosso in modalità danger', async () => {
    TestBed.inject(ConfirmService).confirm({ title: 'Elimina', message: 'Sicuro?', type: 'danger' });
    await settle();
    const container = panes()[0].querySelector<HTMLElement>('mat-dialog-container')!;
    expect(container.getAttribute('role')).toBe('dialog');
    // Material rende la modalità nascondendo il resto della pagina agli screen reader
    const hiddenSiblings = Array.from(document.body.children).filter(el => el.getAttribute('aria-hidden') === 'true');
    expect(hiddenSiblings.length).toBeGreaterThan(0);
    const labelledBy = container.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelledBy)!.textContent!.trim()).toBe('Elimina');
    expect(button(panes()[0], 'Conferma').classList).toContain('!bg-error');
  });

  it('alert ha role=alertdialog e risolve alla chiusura', async () => {
    const done = TestBed.inject(AlertService).alert({ message: 'Fatto', type: 'success' });
    await settle();
    expect(panes()[0].querySelector('mat-dialog-container')!.getAttribute('role')).toBe('alertdialog');
    button(panes()[0], 'Chiudi').click();
    await settle();
    await expectAsync(done).toBeResolved();
  });
});

describe('ConfirmService / AlertService con isHtml', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  const settle = async () => {
    TestBed.tick();
    await new Promise(r => setTimeout(r));
    TestBed.tick();
  };
  const content = () => document.querySelector<HTMLElement>('.cdk-overlay-pane.core-dialog mat-dialog-content')!;
  const XSS = '<b>Elimina</b> la pratica?<img src="x" onerror="window.__pwned()"><script>window.__pwned()</script>';

  for (const kind of ['confirm', 'alert'] as const) {
    it(`${kind}: isHtml rende la formattazione e rimuove script e handler`, async () => {
      const pwned = jasmine.createSpy('pwned');
      (window as unknown as { __pwned: () => void }).__pwned = pwned;
      if (kind === 'confirm') TestBed.inject(ConfirmService).confirm({ message: XSS, isHtml: true });
      else TestBed.inject(AlertService).alert({ message: XSS, isHtml: true });
      await settle();

      const html = content().innerHTML;
      expect(content().querySelector('b')!.textContent).toBe('Elimina');
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('<script');
      expect(pwned).not.toHaveBeenCalled();
    });

    it(`${kind}: senza isHtml il markup resta testo`, async () => {
      if (kind === 'confirm') TestBed.inject(ConfirmService).confirm({ message: '<b>x</b>' });
      else TestBed.inject(AlertService).alert({ message: '<b>x</b>' });
      await settle();
      expect(content().querySelector('b')).toBeNull();
      expect(content().textContent).toContain('<b>x</b>');
    });
  }
});

describe('ConfirmService / AlertService: il testo resta nel dialog', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
    document.body.classList.add('ui');
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  const settle = async () => {
    TestBed.tick();
    await new Promise(r => setTimeout(r));
    TestBed.tick();
  };
  const LONG = 'ERR_' + 'X'.repeat(150);
  const cases: [string, string, boolean][] = [
    ['parola lunga', LONG, false],
    ['HTML <pre>', `<pre>${LONG}</pre>`, true],
    ['HTML con style rimosso', `<div style="word-break:break-all">${LONG}</div>`, true],
  ];

  for (const kind of ['confirm', 'alert'] as const) {
    for (const [name, message, isHtml] of cases) {
      it(`${kind}: ${name}`, async () => {
        if (kind === 'confirm') TestBed.inject(ConfirmService).confirm({ message, isHtml });
        else TestBed.inject(AlertService).alert({ message, isHtml });
        await settle();
        const content = document.querySelector<HTMLElement>('.cdk-overlay-pane.core-dialog mat-dialog-content')!;
        expect(content.scrollWidth).withContext('nessuno scroll orizzontale').toBeLessThanOrEqual(content.clientWidth + 1);
      });
    }
  }
});
