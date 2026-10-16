import { Signal } from '@angular/core';

/**
 * Maschere di input per `TextInputFieldComponent` (input `mask`).
 *
 * Simboli della maschera:
 * - `0` — una cifra
 * - `A` — una lettera
 * - `*` — una lettera o una cifra
 * - `\` — il carattere successivo è un letterale (es. `\0` per uno zero fisso)
 *
 * Ogni altro carattere è un letterale (spazi, `-`, `/`, `(`, `+`...): viene inserito da solo
 * mentre si scrive e non finisce nel valore "pulito".
 *
 * Esempi: `'00/00/0000'`, `'(000) 000-0000'`, `'AAAAAA00A00A000A'` (codice fiscale),
 * `'AA00 A000 0000 0000 0000 0000 000'` (IBAN), `'+39 000 0000000'`.
 */

type MaskSlot = { token: '0' | 'A' | '*' } | { literal: string };

const TOKENS = new Set(['0', 'A', '*']);

function parseMask(mask: string): MaskSlot[] {
  const slots: MaskSlot[] = [];
  for (let i = 0; i < mask.length; i++) {
    const c = mask[i];
    if (c === '\\' && i + 1 < mask.length) slots.push({ literal: mask[++i] });
    else if (TOKENS.has(c)) slots.push({ token: c as '0' | 'A' | '*' });
    else slots.push({ literal: c });
  }
  return slots;
}

const LETTER = /\p{L}/u;
const DIGIT = /\d/;

function accepts(token: '0' | 'A' | '*', c: string): boolean {
  if (token === '0') return DIGIT.test(c);
  if (token === 'A') return LETTER.test(c);
  return DIGIT.test(c) || LETTER.test(c);
}

/**
 * Allinea un testo alla maschera e ne restituisce i soli caratteri dei segnaposto.
 * Accetta sia testo già formattato (`'12/03/2024'`) sia pulito (`'12032024'`): i letterali
 * presenti al loro posto vengono saltati, i caratteri non ammessi dal segnaposto scartati,
 * quelli oltre la fine della maschera ignorati. Le lettere restano come digitate.
 */
export function unmaskValue(text: string | null | undefined, mask: string): string {
  if (!text) return '';
  const slots = parseMask(mask);
  const chars = Array.from(text);
  let raw = '';
  let s = 0;
  let i = 0;
  while (i < chars.length && s < slots.length) {
    const slot = slots[s];
    if ('literal' in slot) {
      // Sequenza di letterali consecutivi: se il testo la contiene (anche solo l'inizio, fino
      // alla fine del testo) viene saltata, altrimenti è data per inserita. Così un prefisso
      // come '+39 ' non si "mangia" le cifre di un valore pulito che inizia per 3.
      let end = s;
      let run = '';
      while (end < slots.length && 'literal' in slots[end]) run += (slots[end++] as { literal: string }).literal;
      const ahead = chars.slice(i, i + run.length).join('');
      if (run.startsWith(ahead) && (ahead.length === run.length || i + ahead.length === chars.length)) {
        i += ahead.length;
      }
      s = end;
      continue;
    }
    if (accepts(slot.token, chars[i])) { raw += chars[i]; s++; }
    i++;
  }
  return raw;
}

/**
 * Applica la maschera a un valore (pulito o già formattato). I letterali finali compaiono
 * solo quando segue un altro carattere: `applyMask('12', '00/00')` → `'12'`, non `'12/'`.
 * Utile anche fuori dai form, es. `format` di una colonna del datatable.
 */
export function applyMask(value: string | null | undefined, mask: string): string {
  const raw = unmaskValue(value, mask);
  const slots = parseMask(mask);
  let out = '';
  let pending = '';
  let r = 0;
  for (const slot of slots) {
    if (r >= raw.length) break;
    if ('literal' in slot) { pending += slot.literal; continue; }
    out += pending + raw[r++];
    pending = '';
  }
  return out;
}

/**
 * Posizione del cursore in un testo formattato con `applyMask` subito dopo il `rawCount`-esimo
 * carattere pulito (prima del primo segnaposto se `rawCount` è 0). Uso interno del field.
 */
export function maskCaretPosition(formatted: string, mask: string, rawCount: number): number {
  const slots = parseMask(mask);
  let seen = 0;
  for (let k = 0; k < formatted.length && k < slots.length; k++) {
    if (!('token' in slots[k])) continue;
    if (seen === rawCount) return k;
    seen++;
  }
  return formatted.length;
}

/** Numero di segnaposto della maschera (lunghezza del valore pulito completo). */
export function maskSlotCount(mask: string): number {
  return parseMask(mask).filter(s => 'token' in s).length;
}

/** true se la maschera contiene solo segnaposto numerici (`0`): tastiera numerica sul mobile. */
export function isNumericMask(mask: string): boolean {
  const tokens = parseMask(mask).filter((s): s is { token: '0' | 'A' | '*' } => 'token' in s);
  return tokens.length > 0 && tokens.every(s => s.token === '0');
}

export interface MaskValidatorOptions {
  mask: string;
  message?: string;
}

/**
 * Validatore per i Signal Forms: il valore deve riempire tutti i segnaposto della maschera.
 * Funziona sia con valore pulito sia formattato. Campo vuoto: valido (usare `required`).
 *
 * ```ts
 * validate(p.cf, maskValidator({ mask: 'AAAAAA00A00A000A' }))
 * ```
 */
export function maskValidator(options: MaskValidatorOptions) {
  const needed = maskSlotCount(options.mask);
  return <T>(ctx: { value: Signal<T> }) => {
    const v = ctx.value();
    if (v === null || v === undefined || v === '') return undefined;
    if (unmaskValue(String(v), options.mask).length === needed) return undefined;
    return { kind: 'mask', message: options.message ?? 'Valore incompleto' };
  };
}
