import { Injectable, Signal, computed, inject } from '@angular/core';
import { SystemService } from './system.service';
import { CoreLabels, LIB_LABELS, resolveLabels } from './labels';

/** Testi correnti della libreria, reattivi a `environment.language`. */
@Injectable({ providedIn: 'root' })
export class CoreLabelsService {
  private readonly system = inject(SystemService);
  private readonly overrides = inject(LIB_LABELS);

  readonly labels: Signal<CoreLabels> = computed(() =>
    resolveLabels(this.system.environment()?.language, this.overrides),
  );
}
