import { ErrorStateMatcher } from '@angular/material/core';

/** ErrorStateMatcher control-independent: delega a un predicato basato sui signal
 *  del field state. Serve ai field picker/custom senza [formField] (quindi senza
 *  NgControl), dove Material non ricalcolerebbe mai errorState da solo. */
export class FieldStateErrorMatcher implements ErrorStateMatcher {
  constructor(private readonly isError: () => boolean) {}

  isErrorState(): boolean {
    return this.isError();
  }
}
