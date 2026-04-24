import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField, FieldTree } from '@angular/forms/signals';
import { FormFieldDef } from '../form-field.models';

@Component({
  selector: 'core-textarea-field',
  imports: [MatFormFieldModule, MatInputModule, FormField],
  templateUrl: './textarea-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaFieldComponent {
  readonly formField   = input.required<any>();
  readonly rows        = input<number>(3);
  readonly label       = input<string>('');
}
