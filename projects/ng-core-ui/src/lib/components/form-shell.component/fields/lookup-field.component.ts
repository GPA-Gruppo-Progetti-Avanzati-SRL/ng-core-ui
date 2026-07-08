import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Type,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LookupResult } from '../form-field.models';
import { LookupPickerDialogComponent } from './lookup-picker-dialog.component';
import { FieldStateErrorMatcher } from './field-error-state-matcher';

export interface LookupDialogConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component:  Type<any>;
  title?:     string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?:      Record<string, any>;
  width?:     string;
  maxWidth?:  string;
}

@Component({
  selector: 'core-lookup-field',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatIconButton, MatTooltipModule],
  templateUrl: './lookup-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupFieldComponent {
  readonly formField    = input.required<any>();
  readonly dialogConfig = input.required<LookupDialogConfig>();
  readonly label        = input<string>('');

  private readonly _dialog     = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _input = viewChild(MatInput);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly fieldState = computed<any>(() => this.formField()());

  protected readonly required     = computed(() => this.fieldState()?.required?.() ?? false);
  protected readonly disabled     = computed(() => this.fieldState()?.disabled?.() ?? false);
  protected readonly hasError     = computed(() =>
    !!(this.fieldState()?.touched?.() && this.fieldState()?.invalid?.())
  );
  protected readonly errorMessage = computed<string>(() =>
    this.fieldState()?.errors?.()?.[0]?.message ?? 'Campo non valido'
  );

  /** ErrorStateMatcher control-independent: riflette invalid && touched del field state. */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.hasError());
  readonly editable = computed(() => {
    if (!this.formField() || ! this.formField()()) return true;
    return !this.formField()().readonly?.() && !this.formField()().disabled?.();
  });
  protected readonly selected     = computed<LookupResult | null>(() => this.fieldState()?.value?.() ?? null);
  /** true solo se c'è una selezione significativa (id non null/undefined) */
  protected readonly hasSelection = computed<boolean>(() => {
    const s = this.selected();
    return s != null && s.id != null;
  });

  constructor() {
    // Senza NgControl, MatInput non ricalcola mai errorState. Un effect() (reattivo,
    // indipendente da OnPush) forza updateErrorState() a ogni cambio di hasError():
    // il matcher restituisce hasError() e il subscript <mat-error> (sempre in DOM) appare.
    effect(() => {
      // Leggere prima _input() (viewChild, sempre sicuro): risolve solo dopo il render,
      // quando NgComponentOutlet ha già applicato gli input. Solo allora è sicuro leggere
      // hasError() (che dereferenzia formField, input.required) senza incorrere in NG0950.
      const input = this._input();
      if (!input) return;
      this.hasError();
      input.updateErrorState();
    });
    // Sincronizza lo stato iniziale (caso form già invalid+touched al primo render:
    // l'effect da solo non ri-esegue alla risoluzione del viewChild).
    afterNextRender(() => this._input()?.updateErrorState());
  }

  protected open(): void {
    if (this.disabled()) return;
    const cfg = this.dialogConfig();
    const currentIds = this.selected()?.id;
    const initialIds: unknown[] = Array.isArray(currentIds)
      ? currentIds
      : currentIds != null ? [currentIds] : [];
    this._dialog
      .open(LookupPickerDialogComponent, {
        width:    cfg.width    ?? '600px',
        maxWidth: cfg.maxWidth ?? '95vw',
        data:     { ...cfg, data: { ...(cfg.data ?? {}), initialIds } },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result: LookupResult | null | undefined) => {
        if (result) this.fieldState()?.value?.set(result);
      });
  }

  protected clear(): void {
    this.fieldState()?.value?.set(null);
  }
}
