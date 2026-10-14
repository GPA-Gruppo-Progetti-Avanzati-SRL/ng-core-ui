import { InputSignal, Signal, Type, computed, signal, WritableSignal } from '@angular/core';
import { FieldTree, TreeValidationResult, form, SchemaOrSchemaFn, submit } from '@angular/forms/signals';
import { ButtonColor } from '../button.component/button.component';

/** Opzione generica per combobox, radio e checkbox */
export interface KVOption {
  value: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  label: string;
}

/** Definizione UI di un campo — dichiarata dal developer nel layout di FormModel */
// T resta nella firma pubblica (FormFieldDef<Person>) anche se il campo è tipizzato via FieldTree
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface FormFieldDef<T> {
  field:     FieldTree<object | string | number | boolean | null>; // forza branch FieldState (mai AbstractControl)
  label:     string;
  component: Type<CoreFieldComponent>;
  span?:     number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?:   Record<string, any>;
}



export class FormModel<T = any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly model:      WritableSignal<T>;
  readonly ft:         FieldTree<T>;
  readonly fields:     FormFieldDef<T>[];
  readonly invalid:    Signal<boolean>;
  /** true mentre l'azione di `submit()` è in corso (utile per disabilitare il bottone). */
  readonly submitting: Signal<boolean>;

  constructor(
    initialValue: T,
    schema: SchemaOrSchemaFn<T>,
    layout: (ft: FieldTree<T>) => FormFieldDef<T>[],
  ) {
    this.model      = signal(initialValue);
    this.ft         = form(this.model, schema);
    this.fields     = layout(this.ft);
    this.invalid    = computed(() => this.ft().invalid());
    this.submitting = computed(() => this.ft().submitting());
  }

  /** Marca come touched l'intero albero (anche i campi annidati e gli array, non solo il layout). */
  markAllAsTouched(): void {
    this.ft().markAsTouched();
  }

  /**
   * Valida il form e, se valido, esegue `action` (via `submit()` di `@angular/forms/signals`):
   * - marca touched tutto l'albero, così gli errori diventano visibili;
   * - non parte se il form è invalido **o ha validatori asincroni ancora `pending`**;
   * - ignora i click mentre un'azione precedente è in corso (niente doppio POST);
   * - `action` può essere asincrona: `submitting()` resta true finché la Promise non si chiude;
   * - se `action` ritorna errori di validazione (`{ kind, message, fieldTree? }` o un array),
   *   vengono applicati ai campi come errori server.
   *
   * Ritorna true se l'azione è stata eseguita senza errori.
   */
  submit(action: () => unknown): Promise<boolean> {
    return submit(this.ft, {
      action: async () => {
        const result = await action();
        return isValidationResult(result) ? result : undefined;
      },
      ignoreValidators: 'none',
    });
  }

  /** Resetta lo stato touched/dirty di tutti i field, opzionalmente anche il valore. */
  reset(value?: T): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ft().reset(value as any);
  }
}

function isValidationError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && typeof (e as { kind?: unknown }).kind === 'string';
}

function isValidationResult(r: unknown): r is TreeValidationResult {
  return Array.isArray(r) ? r.length > 0 && r.every(isValidationError) : isValidationError(r);
}

/**
 * Bottoni della shell.
 * - `variant`  — 'icon' (solo icona, default se manca label) | 'text' | 'filled'
 * - `position` — 'inline' (stessa riga, default) | 'footer' (riga dedicata sotto)
 * - `visible`  — funzione che controlla la visibilità; default `true`
 * - `disabled` — funzione che controlla lo stato disabilitato; default `false`
 */
export interface FormShellAction {
  icon?:      string;
  label?:     string;
  tooltip?:   string;
  variant?:   'icon' | 'text' | 'filled';
  color?:     ButtonColor;
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
