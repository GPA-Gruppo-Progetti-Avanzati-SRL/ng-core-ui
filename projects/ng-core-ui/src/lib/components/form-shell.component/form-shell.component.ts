import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormFieldDef, FormModel, FormShellAction } from './form-field.models';

@Component({
  selector: 'core-form-shell',
  standalone: true,
  imports: [NgComponentOutlet, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './form-shell.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui' },
})
export class FormShellComponent {
  readonly model   = input.required<FormModel>();
  readonly columns = input<number>(2);
  readonly actions = input<FormShellAction[]>([]);

  protected readonly fields        = computed(() => this.model().fields);
  protected readonly inlineActions = computed(() => this.actions().filter(a => (a.position ?? 'inline') === 'inline'));
  protected readonly footerActions = computed(() => this.actions().filter(a => a.position === 'footer'));

  protected variant(a: FormShellAction): 'icon' | 'text' | 'filled' {
    return a.variant ?? (a.label ? 'text' : 'icon');
  }

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
}
