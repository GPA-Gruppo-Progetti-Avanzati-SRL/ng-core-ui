import { InputSignal, Signal, Type, computed, signal, WritableSignal } from '@angular/core';
import { FieldTree, form } from '@angular/forms/signals';

/** Definizione UI di un campo — dichiarata dal developer nel layout di FormModel */
export interface FormFieldUIDef {
  key:       string;
  label:     string;
  component: Type<CoreFieldComponent>;
  span?:     number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?:   Record<string, any>;
}

/** FormField completo — prodotto da FormModel. Non va costruito manualmente. */
export interface FormFieldDef extends FormFieldUIDef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formField: any;
}

/** Valore di un campo */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FieldValue = any;

export class FormModel<T = any> {
  readonly model:   WritableSignal<T>;
  readonly ft:      FieldTree<T>;
  readonly fields:  FormFieldDef[];
  readonly invalid: Signal<boolean>;

  constructor(
    initialValue: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: any,
    layout: FormFieldUIDef[],
  ) {
    this.model   = signal(initialValue);
    this.ft      = form(this.model, schema);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.fields  = layout.map(f => ({ ...f, formField: (this.ft as any)[f.key] }));
    this.invalid = computed(() => this.ft().invalid());
  }

  /** Marca tutti i field come touched — usato dalla shell al submit per mostrare gli errori. */
  markAllAsTouched(): void {
    for (const f of this.fields) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f.formField as any)()?.markAsTouched?.();
    }
  }

  /** Resetta lo stato touched/dirty di tutti i field, opzionalmente anche il valore. */
  reset(value?: T): void {
    this.ft().reset(value as any);
  }
}

/** Contratto minimo che ogni field component deve implementare */
export interface CoreFieldComponent {
  formField: InputSignal<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** Valore restituito da un LookupDialog */
export interface LookupResult {
  id:    unknown;
  label: string;
}
