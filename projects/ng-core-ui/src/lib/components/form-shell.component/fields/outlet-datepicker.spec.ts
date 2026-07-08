import { Component, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { form, required } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { DatepickerFieldComponent } from './datepicker-field.component';

// Host che replica FormShell (NgComponentOutlet + inputs) con un FieldTree REALE dei signal-forms.
@Component({
  imports: [NgComponentOutlet],
  template: `<ng-container [ngComponentOutlet]="cmp" [ngComponentOutletInputs]="inputs" />`,
})
class OutletHostComponent {
  model = signal<{ d: Date | null }>({ d: null });
  ft = form(this.model, (p) => { required(p.d); });
  cmp = DatepickerFieldComponent;
  inputs: Record<string, unknown> = { formField: this.ft.d, label: 'Data' };
}

describe('DatepickerField via NgComponentOutlet (native, no NG0950)', () => {
  it('renderizza senza NG0950, mostra asterisco e mat-error dopo il touch', async () => {
    await TestBed.configureTestingModule({
      imports: [OutletHostComponent],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();

    const fixture = TestBed.createComponent(OutletHostComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.mat-mdc-form-field-required-marker')).withContext('asterisco').not.toBeNull();
    expect(el.querySelector('.mat-mdc-form-field-error-wrapper')).withContext('nessun errore prima del touch').toBeNull();

    fixture.componentInstance.ft.d().markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(el.querySelector('.mat-mdc-form-field-error-wrapper')).withContext('errore dopo il touch').not.toBeNull();
  });
});
