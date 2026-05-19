import { Signal } from '@angular/core';
import { KVOption } from '../form-shell.component/form-field.models';

// --- URL-based pickers (caricano dal backend) ---

export interface KvPickerBaseConfig {
  lookupName:   string;
  labelColumn?: string;
  valueColumn?: string;
  cancelLabel?: string;
}

export interface KvSinglePickerConfig extends KvPickerBaseConfig {}

export interface KvMultiPickerConfig extends KvPickerBaseConfig {
  confirmLabel?: string;
}

// --- Signal-based pickers (dati già in memoria) ---

export interface KvSignalPickerBaseConfig {
  options:      Signal<KVOption[]>;
  labelColumn?: string;
  valueColumn?: string;
  cancelLabel?: string;
}

export interface KvSignalSinglePickerConfig extends KvSignalPickerBaseConfig {}

export interface KvSignalMultiPickerConfig extends KvSignalPickerBaseConfig {
  confirmLabel?: string;
}
