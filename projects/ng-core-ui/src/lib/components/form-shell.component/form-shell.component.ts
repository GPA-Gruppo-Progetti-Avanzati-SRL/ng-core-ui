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
  host: { class: 'ui' },
})
export class FormShellComponent {
  readonly model   = input.required<FormModel>();
  readonly columns = input<number>(2);
  readonly actions = input<FormShellAction[]>([]);

  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isSmall  = toSignal(this.breakpointObserver.observe(Breakpoints.Small).pipe(map(r => r.matches)), { initialValue: false });
  private readonly isXSmall = toSignal(this.breakpointObserver.observe(Breakpoints.XSmall).pipe(map(r => r.matches)), { initialValue: false });

  protected readonly currentColumns = computed(() => {
    const cols = this.columns();
    if (this.isXSmall()) return 1;
    if (this.isSmall())  return Math.min(cols, 2);
    return cols;
  });

  protected readonly fields        = computed(() => this.model().fields);
  protected readonly inlineActions = computed(() =>
    this.actions()
      .filter(a => (a.position ?? 'inline') === 'inline')
      .filter(a => a.visible?.() ?? true)
  );

  protected readonly lastVisibleField = computed(() => {
    const fields = this.fields();
    for (let i = fields.length - 1; i >= 0; i--) {
      if (!this.isHidden(fields[i])) return fields[i];
    }
    return null;
  });

  /** Calcola span e riga per ogni field, e la riga finale per le azioni inline */
  protected readonly gridLayout = computed(() => {
    const fields = this.fields();
    const cols   = this.currentColumns();
    const hasActions = this.inlineActions().length > 0;
    const lastField  = this.lastVisibleField();

    const fieldInfo = new Map<FormFieldDef<any>, { span: number }>();
    let currentOffset = 0;
    let actionsRow    = 1;

    for (const f of fields) {
      if (this.isHidden(f)) continue;

      let span = Math.min(f.span ?? 1, cols);
      const remainder = currentOffset % cols;

      // Se il campo non ci sta nella riga corrente (skip grid auto-placement)
      if (remainder > 0 && remainder + span > cols) {
        currentOffset += (cols - remainder);
      }

      const row = Math.floor(currentOffset / cols) + 1;

      if (f === lastField && hasActions) {
        // Estende il field per occupare tutto lo spazio rimanente delle colonne standard
        span = cols - (currentOffset % cols);
        actionsRow = row;
      }

      fieldInfo.set(f, { span });
      currentOffset += span;
    }

    // Se non ci sono field ma ci sono azioni, le mettiamo in riga 1
    if (!lastField && hasActions) actionsRow = 1;

    return { fieldInfo, actionsRow };
  });

  protected readonly footerActions = computed(() =>
    this.actions()
      .filter(a => a.position === 'footer')
      .filter(a => a.visible?.() ?? true)
  );

  protected variant(a: FormShellAction): 'icon' | 'text' | 'filled' {
    return a.variant ?? (a.label ? 'text' : 'icon');
  }

  protected isHidden<T>(f: FormFieldDef<T>): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f.field as any)()?.hidden?.() ?? false;
  }

  protected fieldInputs<T>(f: FormFieldDef<T>): Record<string, unknown> {
    return {
      formField: f.field,
      label:     f.label,
      ...(f.inputs ?? {}),
    };
  }
}
