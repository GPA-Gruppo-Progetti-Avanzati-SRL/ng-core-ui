import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { FormField } from '@angular/forms/signals';


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

  // Il datepicker ha un NgControl reale (via [formField]): Material mostra nativamente
  // l'asterisco required e il mat-error tramite MatInput.ngDoCheck. Nessun meccanismo custom.
  readonly editable = computed(() => {
    if (!this.formField() || ! this.formField()()) return true;
    return !this.formField()().readonly?.() && !this.formField()().disabled?.();
  });
}
