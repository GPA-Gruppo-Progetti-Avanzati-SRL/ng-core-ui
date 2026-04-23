import { InputSignal, Signal, Type, computed, signal, WritableSignal } from '@angular/core';
import { FieldTree, form } from '@angular/forms/signals';

/** Definizione UI di un campo — dichiarata dal developer nel layout di FormModel */
export interface FormFieldDef<T> {
  field:     FieldTree<object | string | number | boolean | null>; // forza branch FieldState (mai AbstractControl)
  label:     string;
  component: Type<CoreFieldComponent>;
  span?:     number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?:   Record<string, any>;
}



/** Valore di un campo */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
//export type FieldValue = any;

export class FormModel<T = any> {
  readonly model:   WritableSignal<T>;
  readonly ft:      FieldTree<T>;
  readonly fields:  FormFieldDef<T>[];
  readonly invalid: Signal<boolean>;

  constructor(
    initialValue: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: any,
    layout: (ft: FieldTree<T>) => FormFieldDef<T>[],
  ) {
    this.model   = signal(initialValue);
    this.ft      = form(this.model, schema);
    this.fields  = layout(this.ft);
    this.invalid = computed(() => this.ft().invalid());
  }

  /** Marca tutti i field come touched — usato dalla shell al submit per mostrare gli errori. */
  markAllAsTouched(): void {
    for (const f of this.fields) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (f.field as any)()?.markAsTouched?.();
    }
  }

  /**
   * Valida il form e, se valido, esegue `action`.
   * Marca tutti i field come touched così gli errori sono visibili.
   */
  submit(action: () => void): void {
    this.markAllAsTouched();
    if (this.invalid()) return;
    action();
  }

  /** Resetta lo stato touched/dirty di tutti i field, opzionalmente anche il valore. */
  reset(value?: T): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ft().reset(value as any);
  }
}

/**
 * Bottoni della shell.
 * - `variant`  — 'icon' (solo icona, default se manca label) | 'text' | 'filled'
 * - `position` — 'inline' (stessa riga, default) | 'footer' (riga dedicata sotto)
 * - `visible`  — funzione (anche signal-based) che controlla la visibilità; default `true`
 * - `disabled` — funzione (anche signal-based) che controlla lo stato disabilitato; default `false`
 */
export interface FormShellAction {
  icon?:      string;
  label?:     string;
  tooltip?:   string;
  variant?:   'icon' | 'text' | 'filled';
  position?:  'inline' | 'footer';
  onClick:    () => void;
  visible?:   () => boolean;
  disabled?:  () => boolean;
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
