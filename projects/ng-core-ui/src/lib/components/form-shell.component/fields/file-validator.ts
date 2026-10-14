import { Signal } from '@angular/core';

export interface MimeTypeValidatorOptions {
  /**
   * Tipi ammessi: MIME esatto (`application/pdf`), wildcard (`image/*`) o estensione (`.pdf`).
   * Il confronto ignora maiuscole/minuscole.
   */
  allowedTypes: string[];
  message?: string;
}

export interface MaxFileSizeValidatorOptions {
  /** Dimensione massima per singolo file, in byte (es. `5 * 1024 * 1024`). */
  maxBytes: number;
  message?: string;
}

/** Valore di un campo file: singolo (`File | null`) o multiplo (`File[]`). */
function filesOf(value: unknown): File[] {
  if (Array.isArray(value)) return value.filter((f): f is File => f instanceof File);
  return value instanceof File ? [value] : [];
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

/**
 * true se il file rispetta uno dei tipi ammessi. Alcuni browser/OS lasciano `file.type` vuoto
 * (es. .msg, .p7m, certi .csv su Windows): in quel caso decide solo l'estensione.
 */
export function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  const type = file.type.toLowerCase();
  const ext = extensionOf(file.name);
  return allowedTypes.some(raw => {
    const allowed = raw.trim().toLowerCase();
    if (allowed.startsWith('.')) return ext === allowed;
    if (!type) return false;
    if (allowed.endsWith('/*')) return type.startsWith(allowed.slice(0, -1));
    return type === allowed;
  });
}

/**
 * Validatore per i Signal Forms sul tipo dei file selezionati (singolo o multiplo).
 * Campo vuoto: valido (per l'obbligatorietà usare `required`).
 */
export function mimeTypeValidator(options: MimeTypeValidatorOptions) {
  return <T>(ctx: { value: Signal<T> }) => {
    const files = filesOf(ctx.value());
    if (files.every(f => isFileTypeAllowed(f, options.allowedTypes))) return undefined;
    return {
      kind: 'mimeType',
      message: options.message ?? 'Tipologia file non accettata',
    };
  };
}

/** Validatore per i Signal Forms sulla dimensione massima di ciascun file selezionato. */
export function maxFileSizeValidator(options: MaxFileSizeValidatorOptions) {
  return <T>(ctx: { value: Signal<T> }) => {
    const files = filesOf(ctx.value());
    if (files.every(f => f.size <= options.maxBytes)) return undefined;
    return {
      kind: 'maxFileSize',
      message: options.message ?? `File troppo grande (massimo ${formatBytes(options.maxBytes)})`,
    };
  };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${+(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${+(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
