import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Type,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LookupResult } from '../form-field.models';
import { LookupPickerDialogComponent } from './lookup-picker-dialog.component';

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly fieldState = computed<any>(() => this.formField()());

  protected readonly disabled     = computed(() => this.fieldState()?.disabled?.() ?? false);
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
