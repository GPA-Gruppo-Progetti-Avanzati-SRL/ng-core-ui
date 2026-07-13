import { Signal } from '@angular/core';


export interface MimeTypeValidatorOptions {
  allowedTypes: string[];
  message?: string;
}

/**
 * Validatore riutilizzabile per i Signal Forms di Angular
 */
export function mimeTypeValidator(options: MimeTypeValidatorOptions) {
  // Usiamo un Generic <T> per intercettare il tipo reale del campo passato dal form
  return <T>(ctx: { value: Signal<T> }) => {
    const file = ctx.value() as unknown as File | null;

    // Se il campo è vuoto, la validazione passa
    if (!file) {
      return undefined;
    }

    // Controllo del MIME type
    if (!options.allowedTypes.includes(file.type)) {
      return {
        kind: 'mimeType',
        message: options.message ?? 'Tipologia file non accettata',
      };
    }

    return undefined;
  };
}
