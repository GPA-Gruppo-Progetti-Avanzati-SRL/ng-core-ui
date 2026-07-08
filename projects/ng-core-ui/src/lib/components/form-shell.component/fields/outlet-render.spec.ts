import { Component, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LookupFieldComponent } from './lookup-field.component';

@Component({ selector: 'dummy-dialog', template: '' })
class DummyDialogComponent {}

function makeFieldTree() {
  const state = {
    invalid: signal(true),
    touched: signal(false),
    required: signal(true),
    errors: signal([{ message: 'Obbligatorio' }]),
    value: signal<unknown>(null),
    disabled: signal(false),
    readonly: signal(false),
    markAsTouched: () => state.touched.set(true),
  };
  return () => state;
}

// Host che replica esattamente come FormShell istanzia i field: NgComponentOutlet + inputs.
@Component({
  imports: [NgComponentOutlet],
  template: `<ng-container [ngComponentOutlet]="cmp" [ngComponentOutletInputs]="inputs" />`,
})
class OutletHostComponent {
  cmp = LookupFieldComponent;
  inputs: Record<string, unknown> = {
    formField: makeFieldTree(),
    label: 'Referente',
    dialogConfig: { component: DummyDialogComponent },
  };
}

describe('Field via NgComponentOutlet (repro NG0950)', () => {
  it('renderizza senza NG0950 e mostra asterisco', async () => {
    await TestBed.configureTestingModule({ imports: [OutletHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(OutletHostComponent);
    // Non deve lanciare NG0950.
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
    await fixture.whenStable();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.mat-mdc-form-field-required-marker')).withContext('asterisco').not.toBeNull();
  });
});
