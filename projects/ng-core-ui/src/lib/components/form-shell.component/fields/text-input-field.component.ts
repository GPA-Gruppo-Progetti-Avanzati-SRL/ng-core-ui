import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {  FormField} from '@angular/forms/signals';


@Component({
  selector: 'core-text-input-field',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule,FormField],
  templateUrl: './text-input-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputFieldComponent {
  readonly formField   = input.required<any>();
  readonly type        = input<string>('text');
  readonly label       = input<string>('');
}
