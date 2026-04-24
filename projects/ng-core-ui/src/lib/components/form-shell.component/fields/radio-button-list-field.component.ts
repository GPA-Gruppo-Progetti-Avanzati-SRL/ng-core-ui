import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { FormField } from '@angular/forms/signals';

export interface RadioOption {
  value: any;
  label: string;
}

@Component({
  selector: 'core-radio-button-list-field',
  imports: [MatRadioModule, FormField],
  templateUrl: './radio-button-list-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonListFieldComponent {
  readonly formField   = input.required<any>();
  readonly options     = input<RadioOption[]>([]);
  readonly label       = input<string>('');
}
