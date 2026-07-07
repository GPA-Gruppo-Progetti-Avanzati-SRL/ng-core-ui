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
import { FormFieldDef, FormModel, FormShellAction } from './form-field.models';
import { CoreButtonComponent } from '../button.component/button.component';

@Component({
  selector: 'core-form-shell',
  standalone: true,
  imports: [NgComponentOutlet, LayoutModule, CoreButtonComponent],
  templateUrl: './form-shell.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui', style: 'display: block; width: 100%' },
})
export class FormShellComponent {
  readonly model   = input.required<FormModel>();
  readonly columns = input<number>(2);
  readonly actions = input<FormShellAction[]>([]);

  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isXSmall = toSignal(
    this.breakpointObserver.observe(Breakpoints.XSmall).pipe(map(r => r.matches)),
    { initialValue: false }
  );
  private readonly isSmall = toSignal(
    this.breakpointObserver.observe(Breakpoints.Small).pipe(map(r => r.matches)),
    { initialValue: false }
  );
  private readonly isMedium = toSignal(
    this.breakpointObserver.observe(Breakpoints.Medium).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  /**
   * Riduzione proporzionale delle colonne per breakpoint:
   * XSmall → 1  |  Small → min(2, cols)  |  Medium → min(3, cols)  |  Large+ → cols
   */
  protected readonly currentColumns = computed(() => {
    const cols = this.columns();
    if (this.isXSmall()) return 1;
    if (this.isSmall())  return Math.min(cols, 2);
    return cols;
  });

  protected readonly gap = computed(() => {
  if (this.isXSmall()) return '0.5rem';
  if (this.isSmall())  return '0.625rem';
  return '0.875rem';
});

protected readonly rowGap = computed(() => {
  if (this.isXSmall()) return '0.375rem';
  if (this.isSmall())  return '0.5rem';
  return '1rem';
});

protected readonly columnGap = computed(() => {
  if (this.isXSmall()) return '0.5rem';
  if (this.isSmall())  return '0.75rem';
  return '1rem';
});

  protected readonly padding = computed(() => {
    if (this.isXSmall()) return '0.5rem';
    if (this.isSmall())  return '1rem';
    return '0';
  });

  protected readonly fields        = computed(() => this.model().fields);
  protected readonly inlineActions = computed(() =>
    this.actions()
      .filter(a => (a.position ?? 'inline') === 'inline')
      .filter(a => a.visible?.() ?? true)
      .map(a => ({ ...a, _disabled: a.disabled?.() ?? false }))
  );
  protected readonly footerActions = computed(() =>
    this.actions()
      .filter(a => a.position === 'footer')
      .filter(a => a.visible?.() ?? true)
      .map(a => ({ ...a, _disabled: a.disabled?.() ?? false }))
  );

  protected readonly hasActionColumn = computed(() =>
    this.inlineActions().length > 0 && !this.isXSmall() && !this.isSmall()
  );

  protected readonly layoutColumns = computed(() => {
    const cols = this.currentColumns();
    return this.hasActionColumn() ? cols + 1 : cols;
  });

  protected fieldsColumn(): string {
    if (!this.hasActionColumn()) return '1 / -1';
    return `1 / ${this.layoutColumns()}`;
  }

  protected readonly gridTemplateColumns = computed(() => {
    const cols = this.currentColumns();

    if (!this.hasActionColumn()) {
      return `repeat(${cols}, minmax(0, 1fr))`;
    }

    return `repeat(${cols}, minmax(0, 1fr)) fit-content(64px)`;
  });

  protected isHidden<T>(f: FormFieldDef<T>): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f.field as any)()?.hidden?.() ?? false;
  }

  protected fieldSpan<T>(f: FormFieldDef<T>): number {
    const maxFieldColumns = this.hasActionColumn()
      ? this.currentColumns()
      : this.layoutColumns();

    return Math.min(f.span ?? 1, maxFieldColumns);
  }

  protected actionColumnStart(): string {
    if (!this.inlineActions().length) return '1 / -1';
    if (!this.hasActionColumn()) return '1 / -1';

    const start = this.layoutColumns();
    return `${start} / ${start + 1}`;
  }

  protected fieldInputs<T>(f: FormFieldDef<T>): Record<string, unknown> {
    return {
      formField: f.field,
      label:     f.label,
      ...(f.inputs ?? {}),
    };
  }
}
