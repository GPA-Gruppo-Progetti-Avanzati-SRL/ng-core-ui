import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormField, FieldTree } from '@angular/forms/signals';


@Component({
  selector: 'core-datepicker-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, FormField],
  templateUrl: './datepicker-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatepickerFieldComponent {
  readonly formField   = input.required<any>();
  readonly label       = input<string>('');
}
