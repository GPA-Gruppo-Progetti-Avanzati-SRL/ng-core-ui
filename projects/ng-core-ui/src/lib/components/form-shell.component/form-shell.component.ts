import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { map } from 'rxjs';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormFieldDef, FormModel, FormShellAction } from './form-field.models';

@Component({
  selector: 'core-form-shell',
  standalone: true,
  imports: [NgComponentOutlet, MatButtonModule, MatIconModule, MatTooltipModule, LayoutModule],
  templateUrl: './form-shell.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui', style: 'display: block; width: 100%' },
})
export class FormShellComponent {
  readonly model = input.required<FormModel>();
  readonly columns = input<number>(2);
  readonly actions = input<FormShellAction[]>([]);

  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isXSmall = toSignal(
    this.breakpointObserver.observe(Breakpoints.XSmall).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  protected readonly isCompact = computed(() => this.isXSmall());

  protected readonly padding = computed(() => {
    if (this.isXSmall()) return '0.5rem';
    return '0';
  });

  protected readonly fields = computed(() => this.model().fields);

  protected readonly inlineActions = computed(() =>
    this.actions()
      .filter(a => (a.position ?? 'inline') === 'inline')
      .filter(a => a.visible?.() ?? true)
  );

  protected readonly footerActions = computed(() =>
    this.actions()
      .filter(a => a.position === 'footer')
      .filter(a => a.visible?.() ?? true)
  );

  protected variant(a: FormShellAction): 'icon' | 'text' | 'filled' {
    return a.variant ?? (a.label ? 'text' : 'icon');
  }

  protected isHidden<T>(f: FormFieldDef<T>): boolean {
    return (f.field as any)()?.hidden?.() ?? false;
  }

  protected choiceFields<T>(): FormFieldDef<T>[] {
    return this.fields().filter(f => {
      const name = f.component?.name ?? '';
      return name.toLowerCase().includes('radio') || name.toLowerCase().includes('checkbox');
    }) as FormFieldDef<T>[];
  }

  protected visibleFieldsLeft<T>(): FormFieldDef<T>[] {
    return this.nonChoiceFields().filter((_, i) => i % 3 === 0) as FormFieldDef<T>[];
  }

  protected visibleFieldsCenter<T>(): FormFieldDef<T>[] {
    return this.nonChoiceFields().filter((_, i) => i % 3 === 1) as FormFieldDef<T>[];
  }

  protected visibleFieldsRight<T>(): FormFieldDef<T>[] {
    return this.nonChoiceFields().filter((_, i) => i % 3 === 2) as FormFieldDef<T>[];
  }

  private nonChoiceFields(): FormFieldDef<any>[] {
    return this.fields().filter(f => !this.isHidden(f)).filter(f => {
      const name = f.component?.name ?? '';
      return !name.toLowerCase().includes('radio') && !name.toLowerCase().includes('checkbox');
    });
  }

  protected fieldInputs<T>(f: FormFieldDef<T>): Record<string, unknown> {
    return {
      formField: f.field,
      label: f.label,
      ...(f.inputs ?? {}),
    };
  }
}
