import { Component, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { form, required } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { LookupFieldComponent } from './lookup-field.component';
import { LookupResult } from '../form-field.models';

@Component({ selector: 'dummy-dialog', template: '' })
class DummyDialogComponent {}

// Lookup via NgComponentOutlet con un FieldTree REALE dei signal-forms.
@Component({
  imports: [NgComponentOutlet],
  template: `<ng-container [ngComponentOutlet]="cmp" [ngComponentOutletInputs]="inputs" />`,
})
class OutletHostComponent {
  model = signal<{ ref: LookupResult | null }>({ ref: null });
  ft = form(this.model, (p) => { required(p.ref); });
  cmp = LookupFieldComponent;
  inputs: Record<string, unknown> = {
    formField: this.ft.ref,
    label: 'Referente',
    dialogConfig: { component: DummyDialogComponent },
  };
}

describe('LookupField via NgComponentOutlet con FieldTree reale', () => {
  const errorWrapper = (el: HTMLElement) =>
    el.querySelector('.mat-mdc-form-field-error-wrapper');

  it('required scatta su valore null e l\'errore compare dopo il touch', async () => {
    await TestBed.configureTestingModule({ imports: [OutletHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OutletHostComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const host = fixture.componentInstance;

    // Sanity: con value null e required, il field REALE è invalid.
    expect(host.ft.ref().invalid()).withContext('field invalid con null').toBe(true);
    expect(el.querySelector('.mat-mdc-form-field-required-marker')).withContext('asterisco').not.toBeNull();
    expect(errorWrapper(el)).withContext('nessun errore prima del touch').toBeNull();

    host.ft.ref().markAsTouched();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(errorWrapper(el)).withContext('errore dopo il touch').not.toBeNull();
  });
});
