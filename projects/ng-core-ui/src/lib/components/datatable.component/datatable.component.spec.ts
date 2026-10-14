import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DatatableAction, DatatableComponent } from './datatable.component';

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
      [{ icon: 'edit', onClick: () => {}, visible: r => r.stato === 'BOZZA' }],
      [{ id: 1, stato: 'BOZZA' }, { id: 2, stato: 'CHIUSA' }],
    );
    expect(el.querySelectorAll('tr.mat-mdc-row').length).toBe(2);
    expect(buttons(el).length).toBe(1);
  });

  it('nasconde la colonna azioni se nessuna azione è visibile su nessuna riga', () => {
    const el = render(
      [{ icon: 'edit', onClick: () => {}, visible: r => r.stato === 'BOZZA' }],
      [{ id: 2, stato: 'CHIUSA' }],
    );
    expect(el.querySelectorAll('th').length).toBe(1);
  });
});
