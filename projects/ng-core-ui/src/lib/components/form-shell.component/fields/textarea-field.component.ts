import { CoreLabelsService } from '../../../system/labels.service';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField } from '@angular/forms/signals';

@Component({
  selector: 'core-textarea-field',
  imports: [MatFormFieldModule, MatInputModule, FormField],
  templateUrl: './textarea-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaFieldComponent {
  protected readonly t = inject(CoreLabelsService).labels;
  readonly formField   = input.required<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly rows        = input<number>(2);
  readonly label       = input<string>('');
}
