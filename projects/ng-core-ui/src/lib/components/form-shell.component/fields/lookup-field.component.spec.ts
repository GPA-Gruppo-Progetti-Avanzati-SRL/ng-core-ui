import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LookupFieldComponent } from './lookup-field.component';

@Component({ selector: 'dummy-dialog', template: '' })
class DummyDialogComponent {}

/** Fake FieldState/FieldTree che imita l'API dei signal-forms usata dal componente. */
function makeFieldTree(opts: { invalid: boolean; touched: boolean; required: boolean }) {
  const state = {
    invalid: signal(opts.invalid),
    touched: signal(opts.touched),
    required: signal(opts.required),
    errors: signal(opts.invalid ? [{ message: 'Obbligatorio' }] : []),
    value: signal<unknown>(null),
    disabled: signal(false),
    readonly: signal(false),
    markAsTouched: () => state.touched.set(true),
  };
  const tree = () => state;
  return { tree, state };
}

describe('LookupFieldComponent error/required rendering', () => {
  let fixture: ComponentFixture<LookupFieldComponent>;

  async function setup(opts: { invalid: boolean; touched: boolean; required: boolean }) {
    await TestBed.configureTestingModule({
      imports: [LookupFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LookupFieldComponent);
    const ft = makeFieldTree(opts);
    fixture.componentRef.setInput('formField', ft.tree);
    fixture.componentRef.setInput('dialogConfig', { component: DummyDialogComponent });
    fixture.componentRef.setInput('label', 'Referente');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return ft;
  }

  const errorWrapper = () =>
    (fixture.nativeElement as HTMLElement).querySelector('.mat-mdc-form-field-error-wrapper');

  it('mostra asterisco sempre che il field è required', async () => {
    await setup({ invalid: true, touched: false, required: true });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.mat-mdc-form-field-required-marker'),
    ).withContext('asterisco').not.toBeNull();
  });

  it('NON mostra errore finché non è touched, poi lo mostra dopo markAsTouched (submit)', async () => {
    const ft = await setup({ invalid: true, touched: false, required: true });
    expect(errorWrapper()).withContext('nessun errore prima del touch').toBeNull();

    // Simula FormModel.markAllAsTouched() al submit
    ft.state.markAsTouched();
    fixture.detectChanges();

    expect(errorWrapper()).withContext('errore mostrato dopo il touch').not.toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('mat-error')?.textContent,
    ).toContain('Obbligatorio');
  });

  it('rimuove l\'errore quando il field torna valid', async () => {
    const ft = await setup({ invalid: true, touched: false, required: true });
    ft.state.markAsTouched();
    fixture.detectChanges();
    expect(errorWrapper()).withContext('errore dopo il touch').not.toBeNull();

    ft.state.invalid.set(false);
    ft.state.errors.set([]);
    fixture.detectChanges();
    expect(errorWrapper()).withContext('errore rimosso').toBeNull();
  });

  it('focusout (uscita dal campo senza valorizzare) marca touched e mostra l\'errore', async () => {
    await setup({ invalid: true, touched: false, required: true });
    expect(errorWrapper()).withContext('nessun errore iniziale').toBeNull();

    const formField = (fixture.nativeElement as HTMLElement).querySelector('mat-form-field')!;
    formField.dispatchEvent(new Event('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(errorWrapper()).withContext('errore dopo il blur').not.toBeNull();
  });

  it('clear() marca il campo touched e mostra subito l\'errore', async () => {
    await setup({ invalid: true, touched: false, required: true });
    expect(errorWrapper()).withContext('nessun errore iniziale').toBeNull();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fixture.componentInstance as any).clear();
    fixture.detectChanges();

    expect(errorWrapper()).withContext('errore dopo clear()').not.toBeNull();
  });

  it('mostra l\'errore già al primo render se invalid+touched (es. form invalido al load)', async () => {
    await setup({ invalid: true, touched: true, required: true });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(errorWrapper()).withContext('errore al primo render').not.toBeNull();
  });
});
