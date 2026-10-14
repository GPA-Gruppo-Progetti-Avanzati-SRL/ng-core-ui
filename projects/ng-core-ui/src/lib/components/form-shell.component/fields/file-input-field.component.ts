import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule, MatError } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CoreFieldComponent } from '../form-field.models';
import { FieldStateErrorMatcher } from './field-error-state-matcher';
import { CoreLabelsService } from '../../../system/labels.service';

@Component({
  selector: 'core-file-input-field',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule, MatError],
  templateUrl: './file-input-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileInputFieldComponent implements CoreFieldComponent {

  readonly formField         = input.required<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly label             = input<string>('');
  readonly showAsRequired    = input<boolean>(false);

  /** Con `true` il valore del campo è `File[]` (vuoto = `[]`), altrimenti `File | null`. */
  readonly multiple          = input<boolean>(false);
  readonly acceptedMimeTypes = input<string[]>([]);
  /** Default: testo `field.noFile` del dizionario (it: 'Nessun file selezionato'). */
  readonly valuePlaceHolder  = input<string>();

  protected readonly t = inject(CoreLabelsService).labels;

  private readonly _input = viewChild(MatInput);

  private readonly fieldState = computed<any>(() => this.formField()()); // eslint-disable-line @typescript-eslint/no-explicit-any
  protected readonly required     = computed(() => this.showAsRequired() || (this.fieldState()?.required?.() ?? false));
  protected readonly disabled  = computed(() => this.fieldState()?.disabled?.() ?? false);
  /** File selezionati, sempre come array (valore singolo o multiplo). */
  protected readonly files     = computed<File[]>(() => {
    const v = this.fieldState()?.value?.();
    return Array.isArray(v) ? v : v ? [v] : [];
  });
  protected readonly selected  = computed<boolean>(() => this.files().length > 0);
  protected readonly fileName  = computed<string>(() => {
    const files = this.files();
    return files.length > 3 ? this.t().field.filesSelected(files.length) : files.map(f => f.name).join(', ');
  });
  protected readonly accepts   = computed<string>(() => this.acceptedMimeTypes().join(','));
  protected readonly touched   = computed<boolean>(() => this.fieldState()?.touched?.() ?? false);


  protected readonly hasError = computed<boolean>(() =>
    this.touched() && (this.fieldState()?.invalid?.())
  );

  protected readonly errorMessage = computed<string>(() => {
    const errors = this.fieldState()?.errors?.() ?? [];
    return errors[0]?.message ?? this.t().field.invalid;
  });

  /** ErrorStateMatcher control-independent: senza NgControl MatInput non ricalcola errorState. */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.hasError());

  protected readonly isDraggingOver = signal<boolean>(false);

  constructor() {
    // Forza il ricalcolo di errorState al cambio di hasError() (reattivo, indip. da OnPush).
    effect(() => {
      // Leggere prima _input() (viewChild, sempre sicuro): risolve solo dopo il render,
      // quando NgComponentOutlet ha già applicato gli input. Solo allora è sicuro leggere
      // hasError() (che dereferenzia formField, input.required) senza incorrere in NG0950.
      const input = this._input();
      if (!input) return;
      this.hasError();
      input.updateErrorState();
    });
    // Sincronizza lo stato iniziale (l'effect non ri-esegue alla risoluzione del viewChild).
    afterNextRender(() => this._input()?.updateErrorState());
  }

  /** Marca il campo touched all'uscita dal focus: mostra l'errore se si esce senza allegare. */
  protected markTouched(): void {
    this.fieldState()?.markAsTouched?.();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateData(Array.from(input.files ?? []));
  }

  protected clearFile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateData([]);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
  }

  protected onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.updateData(Array.from(files));
  }

  private updateData(files: File[]): void {
    this.fieldState().value.set(this.multiple() ? files : (files[0] ?? null));
    this.fieldState().markAsTouched();
    this.fieldState().markAsDirty();
  }
}
