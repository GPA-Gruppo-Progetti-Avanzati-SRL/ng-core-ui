import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule, MatError } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CoreFieldComponent } from '../form-field.models';
import { FieldStateErrorMatcher } from './field-error-state-matcher';

@Component({
  selector: 'core-file-input-field',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule, MatError],
  templateUrl: './file-input-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileInputFieldComponent implements CoreFieldComponent {

  readonly formField         = input.required<any>();
  readonly label             = input<string>('');
  readonly showAsRequired    = input<boolean>(false);
  readonly multiple          = input<boolean>(false);
  readonly acceptedMimeTypes = input<string[]>([]);
  readonly valuePlaceHolder  = input<string>('Nessun file selezionato');

  private readonly _input = viewChild(MatInput);

  private readonly fieldState = computed<any>(() => this.formField()());

  protected readonly disabled  = computed(() => this.fieldState()?.disabled?.() ?? false);
  protected readonly selected  = computed<File | null>(() => this.fieldState()?.value?.() ?? null);
  protected readonly fileName  = computed<string>(() => this.selected()?.name ?? '');
  protected readonly accepts   = computed<string>(() => this.acceptedMimeTypes().join(','));
  protected readonly touched   = computed<boolean>(() => this.fieldState()?.touched?.() ?? false);

  protected readonly mimeError = signal<string | null>(null);

  protected readonly hasError = computed<boolean>(() =>
    this.touched() && (this.fieldState()?.invalid?.() || !!this.mimeError())
  );

  protected readonly errorMessage = computed<string>(() => {
    if (this.mimeError()) return this.mimeError()!;
    const errors = this.fieldState()?.errors?.() ?? [];
    return errors[0]?.message ?? 'Campo non valido';
  });

  /** ErrorStateMatcher control-independent: senza NgControl MatInput non ricalcola errorState. */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.hasError());

  protected readonly isDraggingOver = signal<boolean>(false);

  constructor() {
    // Forza il ricalcolo di errorState al cambio di hasError() (reattivo, indip. da OnPush).
    effect(() => {
      this.hasError();
      this._input()?.updateErrorState();
    });
    // Sincronizza lo stato iniziale (l'effect non ri-esegue alla risoluzione del viewChild).
    afterNextRender(() => this._input()?.updateErrorState());
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateData(input.files?.[0] ?? null);
  }

  protected clearFile(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateData(null);
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
    if (files?.length) this.updateData(files[0]);
  }

  private updateData(file: File | null): void {
    this.fieldState().value.set(file ?? null);
    this.fieldState().markAsTouched();
    this.fieldState().markAsDirty();

    const mimeTypes = this.acceptedMimeTypes();
    if (file && mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
      this.mimeError.set('Tipologia file non accettata');
    } else {
      this.mimeError.set(null);
    }
  }
}
