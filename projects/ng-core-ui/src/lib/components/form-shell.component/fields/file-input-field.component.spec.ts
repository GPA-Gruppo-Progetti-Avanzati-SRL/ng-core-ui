import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileInputFieldComponent } from './file-input-field.component';

function makeFieldTree(opts: { invalid: boolean; touched: boolean }) {
  const state = {
    invalid: signal(opts.invalid),
    touched: signal(opts.touched),
    required: signal(true),
    errors: signal(opts.invalid ? [{ message: 'File obbligatorio' }] : []),
    value: signal<unknown>(null),
    disabled: signal(false),
    readonly: signal(false),
    markAsTouched: () => state.touched.set(true),
    markAsDirty: () => {},
  };
  const tree = () => state;
  return { tree, state };
}

describe('FileInputFieldComponent error rendering', () => {
  let fixture: ComponentFixture<FileInputFieldComponent>;

  async function setup(opts: { invalid: boolean; touched: boolean; showAsRequired?: boolean }) {
    await TestBed.configureTestingModule({ imports: [FileInputFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(FileInputFieldComponent);
    const ft = makeFieldTree(opts);
    fixture.componentRef.setInput('formField', ft.tree);
    fixture.componentRef.setInput('label', 'Allegato');
    fixture.componentRef.setInput('showAsRequired', opts.showAsRequired ?? true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return ft;
  }

  const errorWrapper = () =>
    (fixture.nativeElement as HTMLElement).querySelector('.mat-mdc-form-field-error-wrapper');

  it('mostra asterisco quando showAsRequired', async () => {
    await setup({ invalid: true, touched: false });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.mat-mdc-form-field-required-marker'),
    ).not.toBeNull();
  });

  it('mostra errore dopo il touch (submit) e lo rimuove quando valid', async () => {
    const ft = await setup({ invalid: true, touched: false });
    expect(errorWrapper()).withContext('nessun errore prima del touch').toBeNull();

    ft.state.markAsTouched();
    fixture.detectChanges();
    expect(errorWrapper()).withContext('errore dopo il touch').not.toBeNull();

    ft.state.invalid.set(false);
    ft.state.errors.set([]);
    fixture.detectChanges();
    expect(errorWrapper()).withContext('errore rimosso').toBeNull();
  });
});
