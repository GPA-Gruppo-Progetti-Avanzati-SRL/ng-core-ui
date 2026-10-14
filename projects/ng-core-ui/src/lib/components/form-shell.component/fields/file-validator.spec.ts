import { signal } from '@angular/core';
import { isFileTypeAllowed, maxFileSizeValidator, mimeTypeValidator } from './file-validator';

const file = (name: string, type: string, size = 10) => new File([new Uint8Array(size)], name, { type });

describe('validatori file', () => {
  it('MIME esatto, wildcard, estensione e file senza type', () => {
    expect(isFileTypeAllowed(file('a.pdf', 'application/pdf'), ['application/pdf'])).toBeTrue();
    expect(isFileTypeAllowed(file('a.png', 'image/png'), ['image/*'])).toBeTrue();
    expect(isFileTypeAllowed(file('a.PDF', ''), ['.pdf'])).toBeTrue();
    expect(isFileTypeAllowed(file('a.msg', ''), ['application/pdf'])).toBeFalse();
    expect(isFileTypeAllowed(file('a.txt', 'text/plain'), ['image/*', '.pdf'])).toBeFalse();
  });

  it('mimeTypeValidator su valore singolo, multiplo e vuoto', () => {
    const v = mimeTypeValidator({ allowedTypes: ['image/*'] });
    expect(v({ value: signal(null) })).toBeUndefined();
    expect(v({ value: signal([file('a.png', 'image/png'), file('b.jpg', 'image/jpeg')]) })).toBeUndefined();
    expect(v({ value: signal([file('a.png', 'image/png'), file('b.pdf', 'application/pdf')]) })?.kind).toBe('mimeType');
  });

  it('maxFileSizeValidator', () => {
    const v = maxFileSizeValidator({ maxBytes: 1024 });
    expect(v({ value: signal(file('a.bin', '', 1024)) })).toBeUndefined();
    const err = v({ value: signal([file('a.bin', '', 10), file('b.bin', '', 2048)]) });
    expect(err?.kind).toBe('maxFileSize');
    expect(err?.message).toContain('1 KB');
  });
});
