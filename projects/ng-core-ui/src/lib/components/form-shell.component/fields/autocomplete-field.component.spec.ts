import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { disabled, required } from '@angular/forms/signals';
import { FormModel } from '../form-field.models';
import { FormShellComponent } from '../form-shell.component';
import { AutocompleteFieldComponent } from './autocomplete-field.component';
import { SystemService } from '../../../system/system.service';

interface Model { citta: string | null }

const CITTA = [
  { value: 'RM', label: 'Roma' },
  { value: 'MI', label: 'Milano' },
  { value: 'NA', label: 'Napoli' },
  { value: 'RN', label: 'Rimini' },
];

describe('AutocompleteFieldComponent', () => {
  const locked = signal(false);

  function render(inputs: Record<string, unknown>, initial: string | null = null) {
    TestBed.configureTestingModule({
      imports: [FormShellComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        {
          provide: SystemService,
          useValue: {
            environment: signal(null),
            getEnvironmentProperty: (k: string) => (k === 'coreContext' ? 'demo' : undefined),
          },
        },
      ],
    });
    const model = runInInjectionContext(TestBed.inject(Injector), () =>
      new FormModel<Model>(
        { citta: initial },
        p => { required(p.citta); disabled(p.citta, () => locked()); },
        ft => [{ field: ft.citta, label: 'Città', component: AutocompleteFieldComponent, inputs }],
      ),
    );
    const fixture = TestBed.createComponent(FormShellComponent);
    fixture.componentRef.setInput('model', model);
    fixture.componentRef.setInput('columns', 1);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('core-autocomplete-field input')!;
    return { fixture, model, input };
  }

  const options = () => Array.from(document.querySelectorAll<HTMLElement>('mat-option')).map(o => o.textContent!.trim());

  function type(f: { detectChanges(): void }, input: HTMLInputElement, text: string) {
    input.focus();
    input.dispatchEvent(new Event('focusin'));
    input.value = text;
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
  }

  afterEach(() => locked.set(false));

  it('il testo filtra le voci (etichetta o valore, senza maiuscole)', () => {
    const { fixture, input } = render({ options: CITTA });
    type(fixture, input, 'r');
    expect(options()).toEqual(['Roma', 'Rimini']);
    type(fixture, input, 'mi');
    expect(options()).toEqual(['Milano', 'Rimini']);
    type(fixture, input, 'zzz');
    expect(options()).toEqual(['Nessun risultato']);
  });

  it('scegliendo una voce il modello riceve la value e la textbox mostra l\'etichetta', () => {
    const { fixture, model, input } = render({ options: CITTA });
    type(fixture, input, 'nap');
    (document.querySelector('mat-option') as HTMLElement).click();
    fixture.detectChanges();
    expect(model.model().citta).toBe('NA');
    expect(input.value).toBe('Napoli');
  });

  it('testo libero all\'uscita: torna l\'etichetta della voce selezionata', () => {
    const { fixture, model, input } = render({ options: CITTA }, 'MI');
    expect(input.value).toBe('Milano');
    type(fixture, input, 'Mil qualcosa');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(model.model().citta).toBe('MI');
    expect(input.value).toBe('Milano');
  });

  it('testo uguale a un\'etichetta all\'uscita: seleziona quella voce', () => {
    const { fixture, model, input } = render({ options: CITTA });
    type(fixture, input, 'rimini');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(model.model().citta).toBe('RN');
    expect(input.value).toBe('Rimini');
  });

  it('svuotare il campo imposta null e mostra l\'errore required', () => {
    const { fixture, model, input } = render({ options: CITTA }, 'RM');
    type(fixture, input, '');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(model.model().citta).toBeNull();
    expect(model.ft.citta().touched()).toBeTrue();
    expect(model.invalid()).toBeTrue();
  });

  it('reset del modello da fuori aggiorna la textbox', () => {
    const { fixture, model, input } = render({ options: CITTA }, 'RM');
    model.model.set({ citta: 'NA' });
    fixture.detectChanges();
    expect(input.value).toBe('Napoli');
  });

  it('disabled dallo schema: input disabilitato', () => {
    const { fixture, input } = render({ options: CITTA });
    locked.set(true);
    fixture.detectChanges();
    expect(input.disabled).toBeTrue();
  });

  it('lookupName: carica le voci da /api/<coreContext>/properties/<lookupName> ordinate per order', async () => {
    const { fixture, input } = render({ lookupName: 'tipo contratto' }, 'B');
    const req = TestBed.inject(HttpTestingController).expectOne('/api/demo/properties/tipo%20contratto');
    req.flush([
      { key: 'B', value: 'Beta', order: 2, kind: 'x' },
      { key: 'A', value: 'Alfa', order: 1, kind: 'x' },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).withContext('etichetta del valore iniziale dopo il caricamento').toBe('Beta');
    type(fixture, input, '');
    expect(options()).toEqual(['Alfa', 'Beta']);
  });
});
