import { CoreLabelsService } from '../../../system/labels.service';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {FormField} from '@angular/forms/signals';


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
}
