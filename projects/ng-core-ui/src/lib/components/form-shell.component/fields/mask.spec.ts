import { signal } from '@angular/core';
import { applyMask, isNumericMask, maskCaretPosition, maskSlotCount, maskValidator, unmaskValue } from './mask';

describe('mask', () => {
  it('applyMask formatta un valore pulito o già formattato', () => {
    expect(applyMask('12032024', '00/00/0000')).toBe('12/03/2024');
    expect(applyMask('12/03/2024', '00/00/0000')).toBe('12/03/2024');
    expect(applyMask('1203', '00/00/0000')).toBe('12/03');
  });

  it('i letterali finali compaiono solo quando segue un carattere', () => {
    expect(applyMask('12', '00/00/0000')).toBe('12');
    expect(applyMask('', '00/00/0000')).toBe('');
    expect(applyMask(null, '00/00/0000')).toBe('');
  });

  it('scarta i caratteri non ammessi e quelli oltre la maschera', () => {
    expect(applyMask('1a2b0c3', '00/00')).toBe('12/03');
    expect(applyMask('120320249999', '00/00/0000')).toBe('12/03/2024');
    expect(applyMask('AB12', '00AA')).toBe('12');
  });

  it('prefisso letterale con cifre: non consuma le cifre del valore pulito', () => {
    expect(applyMask('3331234567', '+39 000 0000000')).toBe('+39 333 1234567');
    expect(applyMask('+39 333 1234567', '+39 000 0000000')).toBe('+39 333 1234567');
    expect(unmaskValue('+39 333 1234567', '+39 000 0000000')).toBe('3331234567');
    expect(applyMask('3', '+39 000 0000000')).toBe('+39 3');
  });

  it('codice fiscale e IBAN', () => {
    expect(applyMask('rssmra80a01h501u', 'AAAAAA00A00A000A')).toBe('rssmra80a01h501u');
    expect(applyMask('IT60X0542811101000000123456', 'AA00 A000 0000 0000 0000 0000 000'))
      .toBe('IT60 X054 2811 1010 0000 0123 456');
  });

  it('escape \\ per i letterali che sono simboli', () => {
    expect(applyMask('12', '\\A-00')).toBe('A-12');
    expect(unmaskValue('A-12', '\\A-00')).toBe('12');
  });

  it('maskCaretPosition, maskSlotCount, isNumericMask', () => {
    expect(maskCaretPosition('12/03', '00/00/0000', 2)).toBe(3);
    expect(maskCaretPosition('12/03', '00/00/0000', 1)).toBe(1);
    expect(maskCaretPosition('+39 3', '+39 000', 0)).toBe(4);
    expect(maskSlotCount('00/00/0000')).toBe(8);
    expect(isNumericMask('00/00/0000')).toBeTrue();
    expect(isNumericMask('AAAAAA00A00A000A')).toBeFalse();
  });

  it('maskValidator: incompleto → errore, vuoto o completo → valido', () => {
    const v = maskValidator({ mask: '00/00/0000' });
    expect(v({ value: signal('1203') })?.kind).toBe('mask');
    expect(v({ value: signal('12032024') })).toBeUndefined();
    expect(v({ value: signal('12/03/2024') })).toBeUndefined();
    expect(v({ value: signal('') })).toBeUndefined();
    expect(v({ value: signal(null) })).toBeUndefined();
  });
});
