import { CoreLabelsService } from '../../../system/labels.service';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  input,
  inject,
  viewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import {FormField} from '@angular/forms/signals';
import { FieldStateErrorMatcher } from './field-error-state-matcher';
import { applyMask, isNumericMask, maskCaretPosition, unmaskValue } from './mask';

/**
 * Campo di testo del FormShell.
 *
 * Con `mask` (vedi `mask.ts`: `0` cifra, `A` lettera, `*` lettera o cifra, il resto letterali)
 * la textbox mostra il valore formattato mentre si scrive; nel modello va il valore pulito,
 * senza letterali (`keepMask: true` per salvare quello formattato). Un valore del modello
 * pulito o già formattato viene comunque mostrato con la maschera. `uppercase` porta le
 * lettere in maiuscolo (anche senza maschera). La completezza si valida nello schema con
 * `maskValidator`.
 */
@Component({
  selector: 'core-text-input-field',
  imports: [MatFormFieldModule, MatInputModule,FormField],
  templateUrl: './text-input-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputFieldComponent {
  protected readonly t = inject(CoreLabelsService).labels;
  readonly formField   = input.required<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly type        = input<string>('text');
  readonly label       = input<string>('');
  /** Maschera di input, es. `'00/00/0000'` o `'AAAAAA00A00A000A'`. */
  readonly mask        = input<string>();
  /** Con `mask`: salva nel modello il valore formattato invece di quello pulito. */
  readonly keepMask    = input<boolean>(false);
  /** Lettere in maiuscolo mentre si scrive (es. codice fiscale, targa). */
  readonly uppercase   = input<boolean>(false);
  readonly placeholder = input<string>();

  private readonly _input = viewChild(MatInput);

  /** Senza maschera né maiuscolo resta il binding diretto `[formField]`. */
  protected readonly custom = computed(() => !!this.mask() || this.uppercase());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly fieldState = computed<any>(() => this.formField()());

  protected readonly required     = computed(() => this.fieldState()?.required?.() ?? false);
  protected readonly disabled     = computed(() => this.fieldState()?.disabled?.() ?? false);
  protected readonly readonly     = computed(() => this.fieldState()?.readonly?.() ?? false);
  protected readonly hasError     = computed(() =>
    !!(this.fieldState()?.touched?.() && this.fieldState()?.invalid?.()),
  );
  protected readonly errorMessage = computed<string>(() =>
    this.fieldState()?.errors?.()?.[0]?.message ?? this.t().field.invalid,
  );
  /** Senza NgControl MatInput non ricalcola errorState da solo (come LookupField). */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.hasError());

  /** Testo mostrato: valore del modello con maschera e maiuscolo applicati. */
  protected readonly display = computed(() => {
    const v = this.fieldState()?.value?.();
    return this.format(v === null || v === undefined ? '' : String(v));
  });

  protected readonly maxLength = computed(() => this.mask()?.replace(/\\(.)/g, '$1').length ?? null);
  protected readonly inputMode = computed(() => {
    const m = this.mask();
    return m && isNumericMask(m) ? 'numeric' : null;
  });

  constructor() {
    effect(() => {
      const input = this._input();
      if (!input || !this.custom()) return;
      this.hasError();
      input.updateErrorState();
    });
    afterNextRender(() => { if (this.custom()) this._input()?.updateErrorState(); });
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const mask = this.mask();
    const text = this.uppercase() ? el.value.toUpperCase() : el.value;
    const caret = el.selectionStart ?? text.length;

    let formatted = text;
    let caretPos = caret;
    let value = text;
    if (mask) {
      formatted = applyMask(text, mask);
      caretPos = caret >= text.length
        ? formatted.length
        : maskCaretPosition(formatted, mask, unmaskValue(text.slice(0, caret), mask).length);
      value = this.keepMask() ? formatted : unmaskValue(formatted, mask);
    }

    // Sempre a mano: se il carattere digitato viene scartato il modello non cambia e il
    // binding [value] non riscriverebbe la textbox.
    if (el.value !== formatted) {
      el.value = formatted;
      el.setSelectionRange(caretPos, caretPos);
    }
    const fs = this.fieldState();
    if (fs?.value?.() !== value) {
      fs?.value?.set(value);
      fs?.markAsDirty?.();
    }
  }

  protected onBlur(): void {
    this.fieldState()?.markAsTouched?.();
  }

  private format(text: string): string {
    const mask = this.mask();
    const t = this.uppercase() ? text.toUpperCase() : text;
    return mask ? applyMask(t, mask) : t;
  }
}
