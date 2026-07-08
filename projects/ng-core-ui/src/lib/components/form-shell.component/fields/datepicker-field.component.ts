import { ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation, computed, effect, input } from '@angular/core';
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

  @ViewChild(MatInput) private _input?: MatInput;

  /** ErrorStateMatcher control-independent: riflette invalid && touched del field state. */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.formField()());

  protected readonly required = computed(() => this.formField()()?.required?.() ?? false);

  readonly editable = computed(() => {
    if (!this.formField() || ! this.formField()()) return true;
    return !this.formField()().readonly?.() && !this.formField()().disabled?.();
  });

  constructor() {
    // Forza il ricalcolo di errorState su invalid()/touched() (es. dopo submit).
    effect(() => {
      this.formField()()?.invalid?.();
      this.formField()()?.touched?.();
      this._input?.updateErrorState();
    });
  }
}
