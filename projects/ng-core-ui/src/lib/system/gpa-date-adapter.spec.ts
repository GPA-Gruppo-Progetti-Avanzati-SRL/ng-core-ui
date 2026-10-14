import { TestBed } from '@angular/core/testing';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { GpaDateAdapter, toIsoDate } from './gpa-date-adapter';

describe('GpaDateAdapter', () => {
  let adapter: GpaDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GpaDateAdapter, { provide: MAT_DATE_LOCALE, useValue: 'it' }],
    });
    adapter = TestBed.inject(GpaDateAdapter);
  });

  const ymd = (d: Date | null) => (d && adapter.isValid(d) ? [d.getFullYear(), d.getMonth() + 1, d.getDate()] : null);

  it('legge gg/mm/aaaa in italiano (05/03/2025 è il 5 marzo, non il 3 maggio)', () => {
    expect(ymd(adapter.parse('05/03/2025'))).toEqual([2025, 3, 5]);
    expect(ymd(adapter.parse('31/12/2024'))).toEqual([2024, 12, 31]);
  });

  it('accetta separatori . - e spazio, cifre singole e anno a 2 cifre', () => {
    expect(ymd(adapter.parse('5.3.2025'))).toEqual([2025, 3, 5]);
    expect(ymd(adapter.parse('5-3-25'))).toEqual([2025, 3, 5]);
    expect(ymd(adapter.parse(' 15 03 85 '))).toEqual([1985, 3, 15]);
  });

  it('legge le date ISO aaaa-mm-gg e aaaa/mm/gg', () => {
    expect(ymd(adapter.parse('2025-03-05'))).toEqual([2025, 3, 5]);
    expect(ymd(adapter.parse('2025/03/05'))).toEqual([2025, 3, 5]);
  });

  it('rifiuta date inesistenti o testo libero invece di farle traboccare', () => {
    for (const v of ['31/02/2024', '00/01/2024', '12/13/2024', 'domani', '1/2']) {
      const d = adapter.parse(v);
      expect(d && adapter.isValid(d)).withContext(v).toBeFalsy();
    }
  });

  it('stringa vuota → null', () => {
    expect(adapter.parse('')).toBeNull();
    expect(adapter.parse('   ')).toBeNull();
  });

  it('segue il locale: en-US legge mm/gg/aaaa', () => {
    adapter.setLocale('en-US');
    expect(ymd(adapter.parse('03/05/2025'))).toEqual([2025, 3, 5]);
  });

  it('le date create dal picker restano lo stesso giorno in JSON (niente shift UTC)', () => {
    for (const d of [
      adapter.createDate(2025, 2, 5),
      adapter.parse('05/03/2025')!,
      adapter.addCalendarDays(adapter.createDate(2025, 2, 4), 1),
      adapter.addCalendarMonths(adapter.createDate(2025, 1, 5), 1),
      adapter.deserialize('2025-03-05')!,
    ]) {
      expect(d.toISOString().slice(0, 10)).toBe('2025-03-05');
    }
  });

  it('toIsoDate usa la data locale', () => {
    expect(toIsoDate(new Date(2025, 2, 5, 0, 30))).toBe('2025-03-05');
    expect(toIsoDate(null)).toBeNull();
    expect(toIsoDate(new Date(NaN))).toBeNull();
  });
});
