import { ErrorStateMatcher } from '@angular/material/core';

/** ErrorStateMatcher che riflette lo stato di un signal-form field (invalid && touched),
 *  indipendente dalla presenza di un NgControl (serve ai campi picker senza [formField]). */
export class FieldStateErrorMatcher implements ErrorStateMatcher {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly state: () => any) {}

  isErrorState(): boolean {
    const s = this.state();
    return !!(s?.invalid?.() && s?.touched?.());
  }
}
