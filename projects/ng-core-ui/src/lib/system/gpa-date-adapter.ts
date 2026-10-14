import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

type DatePart = 'day' | 'month' | 'year';

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const NUMERIC_DATE = /^(\d{1,4})[/.\-\s](\d{1,2})[/.\-\s](\d{1,4})$/;

/** Ordine giorno/mese/anno del locale (it → day,month,year; en-US → month,day,year). */
function partOrder(locale: string): DatePart[] {
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
      .formatToParts(new Date(2000, 10, 22))
      .map(p => p.type)
      .filter((t): t is DatePart => t === 'day' || t === 'month' || t === 'year');
  } catch {
    return ['day', 'month', 'year'];
  }
}

/** Anno a 2 cifre: secolo corrente, salvo che cada più di 20 anni nel futuro (85 → 1985). */
function expandYear(year: number, digits: number): number {
  if (digits > 2) return year;
  const current = new Date().getFullYear();
  const candidate = Math.floor(current / 100) * 100 + year;
  return candidate > current + 20 ? candidate - 100 : candidate;
}

/** Data locale alle 12:00: serializzata in UTC (toISOString/JSON) resta lo stesso giorno. */
function atNoon(date: Date): Date {
  date.setHours(12, 0, 0, 0);
  return date;
}

/**
 * DateAdapter della libreria, sostituisce il NativeDateAdapter di Material:
 * - `parse` legge le date digitate nell'ordine del locale (`it`: gg/mm/aaaa, separatori / . - spazio,
 *   anno a 2 o 4 cifre) e `aaaa-mm-gg`; una data inesistente (31/02) è invalida. Il NativeDateAdapter
 *   usava `Date.parse`, che ignora il locale: `05/03/2025` diventava il 3 maggio.
 * - le date create dal picker sono alle **12:00 locali**, così `JSON.stringify`/`toISOString`
 *   non le sposta al giorno prima (mezzanotte italiana = 22:00/23:00 UTC del giorno precedente).
 *
 * Per inviare una data al backend come `YYYY-MM-DD` usare `toIsoDate()`.
 */
@Injectable()
export class GpaDateAdapter extends NativeDateAdapter {
  override createDate(year: number, month: number, date: number): Date {
    return atNoon(super.createDate(year, month, date));
  }

  override addCalendarMonths(date: Date, months: number): Date {
    return atNoon(super.addCalendarMonths(date, months));
  }

  override addCalendarDays(date: Date, days: number): Date {
    return atNoon(super.addCalendarDays(date, days));
  }

  override deserialize(value: unknown): Date | null {
    if (typeof value === 'string') {
      const m = ISO_DATE_ONLY.exec(value);
      // new Date('2025-03-05') è mezzanotte UTC: a ovest di Greenwich sarebbe il 4 marzo.
      if (m) return this._fromParts(+m[1], +m[2], +m[3]);
    }
    return super.deserialize(value);
  }

  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value !== 'string') return super.parse(value, parseFormat);
    const text = value.trim();
    if (!text) return null;

    const iso = ISO_DATE_ONLY.exec(text);
    if (iso) return this._fromParts(+iso[1], +iso[2], +iso[3]);

    const m = NUMERIC_DATE.exec(text);
    if (!m) return this.invalid();

    const tokens = [m[1], m[2], m[3]];
    // L'anno a 4 cifre in testa (2025/03/05) vince sull'ordine del locale.
    const order: DatePart[] = tokens[0].length > 2 ? ['year', 'month', 'day'] : partOrder(this.locale);
    const parts: Partial<Record<DatePart, string>> = {};
    order.forEach((part, i) => (parts[part] = tokens[i]));
    if (!parts.day || !parts.month || !parts.year) return this.invalid();

    return this._fromParts(expandYear(+parts.year, parts.year.length), +parts.month, +parts.day);
  }

  /** Mese 1-based; data invalida se giorno o mese sono fuori range (niente overflow 31/02 → 03/03). */
  private _fromParts(year: number, month: number, day: number): Date {
    if (month < 1 || month > 12 || day < 1) return this.invalid();
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    date.setFullYear(year); // anni 0-99 non vanno mappati su 1900-1999
    return date.getMonth() === month - 1 && date.getDate() === day ? date : this.invalid();
  }
}

/** `YYYY-MM-DD` della data **locale** (non UTC), da usare per inviare date al backend. */
export function toIsoDate(date: Date | null | undefined): string | null {
  if (!date || isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear()).padStart(4, '0')}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
