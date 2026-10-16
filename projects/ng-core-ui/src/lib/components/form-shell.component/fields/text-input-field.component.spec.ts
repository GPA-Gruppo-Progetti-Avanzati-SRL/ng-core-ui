import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { disabled, required, validate } from '@angular/forms/signals';
import { FormModel } from '../form-field.models';
import { FormShellComponent } from '../form-shell.component';
import { TextInputFieldComponent } from './text-input-field.component';
import { maskValidator } from './mask';

interface Model { v: string | null }

describe('TextInputFieldComponent', () => {
  const locked = signal(false);

  function render(inputs: Record<string, unknown>, initial: string | null = null, mask?: string) {
    TestBed.configureTestingModule({
      imports: [FormShellComponent],
      providers: [{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }],
    });
    const model = runInInjectionContext(TestBed.inject(Injector), () =>
      new FormModel<Model>(
        { v: initial },
        p => {
          required(p.v);
          disabled(p.v, () => locked());
          if (mask) validate(p.v, maskValidator({ mask }));
        },
        ft => [{ field: ft.v, label: 'Campo', component: TextInputFieldComponent, inputs }],
      ),
    );
    const fixture = TestBed.createComponent(FormShellComponent);
    fixture.componentRef.setInput('model', model);
    fixture.componentRef.setInput('columns', 1);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('core-text-input-field input')!;
    return { fixture, model, input };
  }

  function type(f: { detectChanges(): void }, input: HTMLInputElement, text: string, caret = text.length) {
    input.value = text;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input'));
    f.detectChanges();
  }

  const errorText = (f: { nativeElement: HTMLElement }) =>
    f.nativeElement.querySelector('mat-error')?.textContent?.trim() ?? '';

  afterEach(() => locked.set(false));

  it('senza maschera: binding diretto, il modello riceve il testo', () => {
    const { fixture, model, input } = render({}, '');
    type(fixture, input, 'ciao');
    expect(model.model().v).toBe('ciao');
  });

  it('con maschera mostra il valore formattato e salva quello pulito', () => {
    const { fixture, model, input } = render({ mask: '00/00/0000' });
    type(fixture, input, '1203');
    expect(input.value).toBe('12/03');
    expect(model.model().v).toBe('1203');
    type(fixture, input, '12/03/2024');
    expect(model.model().v).toBe('12032024');
  });

  it('valore iniziale e aggiornamenti dal modello vengono mostrati con la maschera', () => {
    const { fixture, model, input } = render({ mask: '(000) 000-0000' }, '0612345678');
    expect(input.value).toBe('(061) 234-5678');
    model.model.set({ v: '3331234567' });
    fixture.detectChanges();
    expect(input.value).toBe('(333) 123-4567');
  });

  it('caratteri non ammessi vengono scartati dalla textbox', () => {
    const { fixture, model, input } = render({ mask: '00/00/0000' }, '12');
    type(fixture, input, '12x');
    expect(input.value).toBe('12');
    expect(model.model().v).toBe('12');
  });

  it('keepMask: nel modello va il valore formattato', () => {
    const { fixture, model, input } = render({ mask: '00/00/0000', keepMask: true });
    type(fixture, input, '12032024');
    expect(input.value).toBe('12/03/2024');
    expect(model.model().v).toBe('12/03/2024');
  });

  it('cursore: inserendo in mezzo resta dopo il carattere digitato', () => {
    const { fixture, input } = render({ mask: '0000 0000' }, '12345678');
    expect(input.value).toBe('1234 5678');
    // digita "9" dopo "12" → testo "1291234 5678", cursore a 3
    type(fixture, input, '1291234 5678', 3);
    expect(input.value).toBe('1291 2345');
    expect(input.selectionStart).toBe(3);
  });

  it('uppercase con maschera (codice fiscale)', () => {
    const { fixture, model, input } = render({ mask: 'AAAAAA00A00A000A', uppercase: true });
    type(fixture, input, 'rssmra80a01h501u');
    expect(input.value).toBe('RSSMRA80A01H501U');
    expect(model.model().v).toBe('RSSMRA80A01H501U');
  });

  it('maskValidator nello schema: valore incompleto mostra l\'errore dopo il blur', () => {
    const { fixture, model, input } = render({ mask: '00/00/0000' }, null, '00/00/0000');
    type(fixture, input, '1203');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(model.invalid()).toBeTrue();
    expect(errorText(fixture)).toBe('Valore incompleto');
    type(fixture, input, '12032024');
    expect(model.invalid()).toBeFalse();
  });

  it('disabled dallo schema con maschera', () => {
    const { fixture, input } = render({ mask: '00/00/0000' });
    locked.set(true);
    fixture.detectChanges();
    expect(input.disabled).toBeTrue();
  });
});
