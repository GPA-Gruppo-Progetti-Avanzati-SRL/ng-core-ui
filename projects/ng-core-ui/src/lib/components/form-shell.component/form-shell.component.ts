import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormFieldDef, FormModel } from './form-field.models';

@Component({
  selector: 'core-form-shell',
  standalone: true,
  imports: [NgComponentOutlet, MatButtonModule],
  templateUrl: './form-shell.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class FormShellComponent {
  readonly model       = input.required<FormModel>();
  readonly columns     = input<number>(2);
  readonly submitLabel = input<string>('Salva');
  readonly cancelLabel = input<string>('Annulla');
  readonly showCancel  = input<boolean>(true);

  readonly submitted = output<void>();
  readonly cancelled = output<void>();

  protected readonly fields = computed(() => this.model().fields);

  protected isHidden(f: FormFieldDef): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f.formField as any)()?.hidden?.() ?? false;
  }

  protected clampSpan(f: FormFieldDef): number {
    return Math.min(f.span ?? 1, this.columns());
  }

  protected fieldInputs(f: FormFieldDef): Record<string, unknown> {
    return {
      formField: f.formField,
      label:     f.label,
      ...(f.inputs ?? {}),
    };
  }

  protected onSubmit(): void {
    this.model().markAllAsTouched();
    if (this.model().invalid()) return;
    this.submitted.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
