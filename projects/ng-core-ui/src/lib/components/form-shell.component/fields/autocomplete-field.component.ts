import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  isSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { httpResource } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KVOption } from '../form-field.models';
import { KVProperty } from '../../../kv-options';
import { FieldStateErrorMatcher } from './field-error-state-matcher';
import { CoreLabelsService } from '../../../system/labels.service';
import { SystemService } from '../../../system/system.service';
import { buildApiPath } from '../../../utils';

/**
 * Tendina con filtro testuale (autocomplete) per il FormShell.
 *
 * Le opzioni arrivano da `options` (array o signal di `KVOption`) oppure, con `lookupName`, dallo
 * stesso endpoint dei KV picker: `GET /api/<coreContext>/properties/<lookupName>` (ordinate per
 * `order`). Il testo digitato filtra le voci per etichetta o valore, senza distinzione di
 * maiuscole. Nel modello finisce la `value` dell'opzione scelta (come nel combobox); il testo
 * libero non viene accettato: uscendo dal campo torna l'etichetta selezionata, a meno che il testo
 * coincida esattamente con un'etichetta. Campo svuotato = `null`.
 */
@Component({
  selector: 'core-autocomplete-field',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatIconButton,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './autocomplete-field.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteFieldComponent {
  readonly formField   = input.required<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  readonly label       = input<string>('');
  /** Opzioni in memoria. Ignorate se è valorizzato `lookupName`. */
  readonly options     = input<KVOption[] | Signal<KVOption[]>>([]);
  /** Nome della lookup sull'endpoint properties (come `kvSinglePicker`). */
  readonly lookupName  = input<string>();
  readonly placeholder = input<string>();
  /** Numero massimo di voci mostrate nella tendina (le altre si raggiungono filtrando). */
  readonly maxResults  = input<number>(50);

  protected readonly t = inject(CoreLabelsService).labels;
  private readonly system = inject(SystemService);
  private readonly _input = viewChild(MatInput);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly fieldState = computed<any>(() => this.formField()());

  private readonly remote = httpResource<KVProperty[] | null>(() => {
    const name = this.lookupName();
    if (!name) return undefined;
    const ctx = this.system.getEnvironmentProperty('coreContext') as string | undefined;
    return buildApiPath('/api', ctx ?? '', 'properties', encodeURIComponent(name));
  });

  /** Tutte le opzioni disponibili, dalla lookup remota o dall'input `options`. */
  protected readonly allOptions = computed<KVOption[]>(() => {
    if (this.lookupName()) {
      const res = this.remote.hasValue() ? this.remote.value() : null;
      return [...(res ?? [])]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(p => ({ value: p.key, label: p.value }));
    }
    const opts = this.options();
    return isSignal(opts) ? (opts as Signal<KVOption[]>)() : (opts as KVOption[]);
  });

  protected readonly loading      = computed(() => !!this.lookupName() && this.remote.isLoading());
  protected readonly required     = computed(() => this.fieldState()?.required?.() ?? false);
  protected readonly disabled     = computed(() => this.fieldState()?.disabled?.() ?? false);
  protected readonly readonly     = computed(() => this.fieldState()?.readonly?.() ?? false);
  protected readonly editable     = computed(() => !this.disabled() && !this.readonly());
  protected readonly hasError     = computed(() =>
    !!(this.fieldState()?.touched?.() && this.fieldState()?.invalid?.()),
  );
  protected readonly errorMessage = computed<string>(() =>
    this.fieldState()?.errors?.()?.[0]?.message ?? this.t().field.invalid,
  );
  /** ErrorStateMatcher control-independent: senza NgControl MatInput non ricalcola errorState. */
  protected readonly errorMatcher = new FieldStateErrorMatcher(() => this.hasError());

  private readonly value = computed<unknown>(() => this.fieldState()?.value?.() ?? null);
  protected readonly hasValue = computed(() => this.value() !== null && this.value() !== '');
  private readonly selectedOption = computed<KVOption | undefined>(() => {
    const v = this.value();
    return v === null ? undefined : this.allOptions().find(o => o.value === v);
  });

  /** Testo nella textbox: filtro mentre si scrive, etichetta della voce scelta altrimenti. */
  protected readonly query   = signal('');
  protected readonly focused = signal(false);

  protected readonly filtered = computed<KVOption[]>(() => {
    const raw = this.query();
    const text = raw.trim().toLowerCase();
    const all = this.allOptions();
    // Con l'etichetta della voce scelta nel campo si mostrano tutte le voci, non solo quella.
    const list = !text || raw === this.selectedOption()?.label
      ? all
      : all.filter(o =>
          o.label.toLowerCase().includes(text) || String(o.value ?? '').toLowerCase().includes(text),
        );
    return list.slice(0, this.maxResults());
  });

  /** `displayWith` di mat-autocomplete: l'opzione scelta mostra la sua etichetta. */
  protected readonly displayWith = (o: KVOption | string | null): string =>
    typeof o === 'string' ? o : (o?.label ?? '');

  constructor() {
    // Valore cambiato da fuori (reset, patch del modello) o opzioni arrivate dal server: la
    // textbox mostra l'etichetta, ma non mentre l'utente sta scrivendo.
    effect(() => {
      const label = this.selectedOption()?.label ?? '';
      if (!untracked(this.focused)) this.query.set(label);
    });
    // Come LookupField: senza NgControl l'errorState va ricalcolato a mano.
    effect(() => {
      const input = this._input();
      if (!input) return;
      this.hasError();
      input.updateErrorState();
    });
    afterNextRender(() => this._input()?.updateErrorState());
  }

  protected onInput(text: string): void {
    this.query.set(text);
  }

  protected onSelect(event: MatAutocompleteSelectedEvent): void {
    const opt = event.option.value as KVOption;
    this.query.set(opt.label);
    this.setValue(opt.value);
  }

  protected onBlur(): void {
    this.focused.set(false);
    const text = this.query().trim();
    if (!text) {
      if (this.hasValue()) this.setValue(null);
      else this.fieldState()?.markAsTouched?.();
      return;
    }
    const exact = this.allOptions().find(o => o.label.toLowerCase() === text.toLowerCase());
    if (exact && exact.value !== this.value()) {
      this.query.set(exact.label);
      this.setValue(exact.value);
      return;
    }
    // Testo libero non corrispondente a una voce: torna l'etichetta della voce selezionata.
    this.query.set(this.selectedOption()?.label ?? '');
    this.fieldState()?.markAsTouched?.();
  }

  protected clear(): void {
    this.query.set('');
    this.setValue(null);
  }

  private setValue(value: unknown): void {
    const fs = this.fieldState();
    fs?.value?.set(value);
    fs?.markAsTouched?.();
    fs?.markAsDirty?.();
  }
}
