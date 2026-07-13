import { Signal } from '@angular/core';


export interface MimeTypeValidatorOptions {
  allowedTypes: string[];
  message?: string;
}

/**
 * Validatore riutilizzabile per i Signal Forms di Angular
 */
export function mimeTypeValidator(options: MimeTypeValidatorOptions) {
  // Riceve il contesto del campo (ctx)
  return ({ value }: { value: Signal<File | null> }) => {
    const file = value();

    // Se non c'è il file, la validazione passa (gestita eventualmente da 'required')
    if (!file) {
      return undefined;
    }

    // Se il tipo non è tra quelli ammessi, restituisci l'oggetto dell'errore
    if (!options.allowedTypes.includes(file.type)) {
      return {
        kind: 'mimeType',
        message: options.message ?? 'Tipologia file non accettata',
      };
    }

    return undefined; // Validazione superata
  };
}
