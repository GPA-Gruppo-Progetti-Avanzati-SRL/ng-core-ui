import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled } from '@angular/forms/signals';
import { FormModel, FormShellAction } from './form-field.models';
import { FormShellComponent } from './form-shell.component';
import { TextInputFieldComponent } from './fields/text-input-field.component';
import { CheckboxListFieldComponent } from './fields/checkbox-list-field.component';
import { FileInputFieldComponent } from './fields/file-input-field.component';
import { SystemService } from '../../system/system.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { of } from 'rxjs';

interface Search { nome: string; cognome: string; tags: string[]; files: File[] }

describe('FormShell e field', () => {
  const locked = signal(false);

  /** Schermo largo: nessun breakpoint XSmall/Small attivo, quindi la colonna azioni c'è. */
  const wideScreen = { observe: () => of({ matches: false, breakpoints: {} }) };

  function render(actions: FormShellAction[], columns = 3) {
    TestBed.configureTestingModule({
      imports: [FormShellComponent],
      providers: [
        { provide: SystemService, useValue: { environment: signal(null) } },
        { provide: BreakpointObserver, useValue: wideScreen },
      ],
    });
    const model = runInInjectionContext(TestBed.inject(Injector), () =>
      new FormModel<Search>(
        { nome: '', cognome: '', tags: [], files: [] },
        p => { disabled(p.tags, () => locked()); },
        ft => [
          { field: ft.nome, label: 'Nome', component: TextInputFieldComponent },
          { field: ft.cognome, label: 'Cognome', component: TextInputFieldComponent },
          { field: ft.tags, label: 'Tag', component: CheckboxListFieldComponent,
            inputs: { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] } },
          { field: ft.files, label: 'Allegati', component: FileInputFieldComponent, inputs: { multiple: true } },
        ],
      ),
    );
    const fixture = TestBed.createComponent(FormShellComponent);
    fixture.componentRef.setInput('model', model);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();
    return { fixture, model, el: fixture.nativeElement as HTMLElement };
  }

  const fieldCells = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLElement>('.grid > .grid > div'));

  it('nessun direction:rtl: ordine visivo = ordine DOM (e di tabulazione)', () => {
    const { el } = render([{ icon: 'search', onClick: () => undefined }]);
    expect(el.innerHTML).not.toContain('rtl');
    const labels = Array.from(el.querySelectorAll('mat-label, .core-checkbox-list-label, span[id^="core-checkbox-list"]'))
      .map(e => e.textContent!.trim());
    expect(labels.slice(0, 3)).toEqual(['Nome', 'Cognome', 'Tag']);
  });

  it('con azioni inline e una riga incompleta i campi partono da destra (offset sul primo)', () => {
    const { el, model } = render([{ icon: 'search', onClick: () => undefined }], 6);
    expect(model.fields.length).toBe(4);
    expect(fieldCells(el)[0].style.gridColumn).toBe('3 / span 1');
    expect(fieldCells(el)[1].style.gridColumn).toBe('span 1');
  });

  it('checkbox list: rispetta disabled dello schema', () => {
    const { fixture, el, model } = render([]);
    const box = () => el.querySelector<HTMLInputElement>('core-checkbox-list-field input[type=checkbox]')!;
    box().click();
    fixture.detectChanges();
    expect(model.model().tags).toEqual(['a']);

    locked.set(true);
    fixture.detectChanges();
    expect(box().disabled).toBeTrue();
    box().click();
    fixture.detectChanges();
    expect(model.model().tags).withContext('nessun cambio da disabilitato').toEqual(['a']);
    locked.set(false);
  });

  it('file input multiple: il valore è un File[] con tutti i file', () => {
    const { fixture, el, model } = render([]);
    const input = el.querySelector<HTMLInputElement>('core-file-input-field input[type=file]')!;
    const dt = new DataTransfer();
    dt.items.add(new File(['x'], 'a.pdf'));
    dt.items.add(new File(['y'], 'b.pdf'));
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(model.model().files.map(f => f.name)).toEqual(['a.pdf', 'b.pdf']);
    expect(el.querySelector<HTMLInputElement>('core-file-input-field input[matinput]')!.value).toBe('a.pdf, b.pdf');
  });
});
