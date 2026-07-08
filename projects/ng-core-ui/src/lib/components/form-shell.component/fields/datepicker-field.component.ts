import { ChangeDetectionStrategy, Component, ViewEncapsulation, afterNextRender, computed, effect, input, viewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInput, MatInputModule } from '@angular/material/input';
import { FormField } from '@angular/forms/signals';
import { FieldStateErrorMatcher } from './field-error-state-matcher';


@Component({
  selector: 'core-datepicker-field',
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, FormField],
  templateUrl: './datepicker-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerFieldComponent {
  readonly formField   = input.required<any>();
  readonly label       = input<string>('');

  private readonly _input = viewChild(MatInput);

  protected readonly required = computed(() => this.formField()()?.required?.() ?? false);
  protected readonly hasError = computed(() =>
    !!(this.formField()()?.touched?.() && this.formField()()?.invalid?.())
  );
  protected readonly errorMessage = computed<string>(() =>
    this.formField()()?.errors?.()?.[0]?.message ?? 'Campo non valido'
  );

  /** ErrorStateMatcher control-independent: riflette invalid && touched del field state. */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.hasError());

  readonly editable = computed(() => {
    if (!this.formField() || ! this.formField()()) return true;
    return !this.formField()().readonly?.() && !this.formField()().disabled?.();
  });

  constructor() {
    // Forza il ricalcolo di errorState a ogni cambio di hasError() (reattivo, indip. da OnPush).
    effect(() => {
      // Leggere prima _input() (viewChild, sempre sicuro): risolve solo dopo il render,
      // quando NgComponentOutlet ha già applicato gli input. Solo allora è sicuro leggere
      // hasError() (che dereferenzia formField, input.required) senza incorrere in NG0950.
      const input = this._input();
      if (!input) return;
      this.hasError();
      input.updateErrorState();
    });
    // Sincronizza lo stato iniziale (l'effect non ri-esegue alla risoluzione del viewChild).
    afterNextRender(() => this._input()?.updateErrorState());
  }
}
