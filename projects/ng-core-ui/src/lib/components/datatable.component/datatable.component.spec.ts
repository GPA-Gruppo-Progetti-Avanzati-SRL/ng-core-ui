import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DatatableAction, DatatableComponent, DatatableLoader } from './datatable.component';

interface Row { id: number; stato: string }

describe('DatatableComponent actions', () => {
  function render(actions: DatatableAction<Row>[], rows: Row[]) {
    TestBed.configureTestingModule({ imports: [DatatableComponent] });
    const fixture = TestBed.createComponent(DatatableComponent);
    const data = signal(rows);
    fixture.componentRef.setInput('columns', [{ key: 'id', label: 'Id' }]);
    fixture.componentRef.setInput('data', () => data());
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const buttons = (el: HTMLElement) => el.querySelectorAll('td button[mat-icon-button]');

  it('non chiama visible(null): un predicato che legge la riga non rompe la tabella', () => {
    const el = render(
      [{ icon: 'edit', onClick: () => undefined, visible: r => r.stato === 'BOZZA' }],
      [{ id: 1, stato: 'BOZZA' }, { id: 2, stato: 'CHIUSA' }],
    );
    expect(el.querySelectorAll('tr.mat-mdc-row').length).toBe(2);
    expect(buttons(el).length).toBe(1);
  });

  it('nasconde la colonna azioni se nessuna azione è visibile su nessuna riga', () => {
    const el = render(
      [{ icon: 'edit', onClick: () => undefined, visible: r => r.stato === 'BOZZA' }],
      [{ id: 2, stato: 'CHIUSA' }],
    );
    expect(el.querySelectorAll('th').length).toBe(1);
  });
});

describe('DatatableComponent loader, selezione e stati', () => {
  async function setup(load: DatatableLoader<Row>, inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [DatatableComponent] });
    const fixture = TestBed.createComponent(DatatableComponent);
    fixture.componentRef.setInput('columns', [{ key: 'id', label: 'Id' }]);
    fixture.componentRef.setInput('load', load);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    await stable(fixture);
    return fixture;
  }
  async function stable(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const el = (f: { nativeElement: HTMLElement }) => f.nativeElement;

  /** Loader server-side finto: ogni chiamata crea oggetti nuovi, come una vera GET. */
  const serverRows = (n: number): DatatableLoader<Row> => (page, size) =>
    of({
      items: Array.from({ length: Math.max(0, Math.min(size, n - (page - 1) * size)) }, (_, i) => ({
        id: (page - 1) * size + i + 1,
        stato: 'X',
      })),
      total: n,
    });

  it('con rowKey la selezione sopravvive al refetch della pagina (oggetti nuovi)', async () => {
    const f = await setup(serverRows(4), { selectionMode: 'multi', rowKey: (r: Row) => r.id, initialPageSize: 2 });
    const selected: unknown[][] = [];
    f.componentInstance.selectionChange.subscribe(s => selected.push(s));

    (el(f).querySelector('td mat-checkbox input') as HTMLInputElement).click();
    await stable(f);
    f.componentInstance.refresh();
    await stable(f);

    const box = el(f).querySelector('td mat-checkbox input') as HTMLInputElement;
    expect(box.checked).withContext('ancora selezionata dopo il refetch').toBeTrue();
    box.click();
    await stable(f);
    expect(selected.at(-1)).withContext('deselezione per chiave, niente duplicati').toEqual([]);
  });

  it('errore del loader: emette loadError, mostra "Riprova" e ricarica', async () => {
    let fail = true;
    const load: DatatableLoader<Row> = () => (fail ? throwError(() => new Error('boom')) : serverRows(1)(1, 10));
    TestBed.configureTestingModule({ imports: [DatatableComponent] });
    const f = TestBed.createComponent(DatatableComponent);
    const errors: unknown[] = [];
    f.componentInstance.loadError.subscribe(e => errors.push(e));
    f.componentRef.setInput('columns', [{ key: 'id', label: 'Id' }]);
    f.componentRef.setInput('load', load);
    await stable(f);

    expect(errors.length).toBe(1);
    const retry = Array.from(el(f).querySelectorAll('button')).find(b => b.textContent!.includes('Riprova'))!;
    expect(retry).toBeDefined();
    fail = false;
    retry.click();
    await stable(f);
    expect(el(f).querySelectorAll('tr.mat-mdc-row').length).toBe(1);
  });

  it('mostra il messaggio vuoto quando non ci sono righe', async () => {
    const f = await setup(serverRows(0), { emptyMessage: 'Nessuna pratica' });
    expect(el(f).textContent).toContain('Nessuna pratica');
  });

  it('pagina oltre la fine (es. dopo una cancellazione) → torna all\'ultima pagina', async () => {
    let n = 3;
    const f = await setup((page, size) => serverRows(n)(page, size), { initialPageSize: 2 });
    (el(f).querySelector('button.mat-mdc-paginator-navigation-next') as HTMLButtonElement).click();
    await stable(f);
    expect(el(f).querySelectorAll('tr.mat-mdc-row').length).toBe(1);

    n = 2; // cancellata l'unica riga di pagina 2
    f.componentInstance.refresh();
    await stable(f);
    expect(el(f).querySelectorAll('tr.mat-mdc-row').length).withContext('pagina 1 con 2 righe').toBe(2);
  });

  it('le celle non coprono lo sfondo della riga (rowBackground visibile)', async () => {
    const f = await setup(serverRows(1), { rowBackground: () => 'rgb(255, 0, 0)' });
    const td = el(f).querySelector('td.mat-mdc-cell') as HTMLElement;
    expect(td.className).not.toContain('bg-');
  });
});
