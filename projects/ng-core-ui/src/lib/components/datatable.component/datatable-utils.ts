/** Helper condivisi da DatatableComponent e dai loader in memoria. */

/** Valore di `key` in notazione dot (`address.city`); `undefined` se un passaggio manca. */
export function getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce(
    (o: unknown, k) => (o != null && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

/** Confronto per l'ordinamento: null in testa, numeri come numeri, il resto con collation numerica. */
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/** Filtro testuale di default: case-insensitive su tutti i valori del record. */
export function defaultFilterFn<T>(row: T, text: string): boolean {
  const lower = text.toLowerCase();
  return Object.values(row as object).some(v => v != null && String(v).toLowerCase().includes(lower));
}
