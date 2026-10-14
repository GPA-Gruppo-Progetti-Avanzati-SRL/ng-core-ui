import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CORE_LABELS_EN, CORE_LABELS_IT, LIB_LABELS, labelsLanguage, resolveLabels } from './labels';
import { CoreLabelsService } from './labels.service';
import { SystemService } from './system.service';

describe('labels', () => {
  it('lingua: it-IT → it, en_GB → en, sconosciuta o assente → it', () => {
    expect(labelsLanguage('it-IT')).toBe('it');
    expect(labelsLanguage('en_GB')).toBe('en');
    expect(labelsLanguage('fr')).toBe('it');
    expect(labelsLanguage(undefined)).toBe('it');
  });

  it('override per sezione: cambia solo le chiavi indicate', () => {
    const l = resolveLabels('it', { it: { datatable: { empty: 'Nessuna pratica' } } });
    expect(l.datatable.empty).toBe('Nessuna pratica');
    expect(l.datatable.retry).toBe(CORE_LABELS_IT.datatable.retry);
    expect(l.confirm).toBe(CORE_LABELS_IT.confirm);
  });

  it('i dizionari hanno le stesse chiavi', () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v).map(s => `${k}.${s}`) : [k])).sort();
    expect(keys(CORE_LABELS_EN)).toEqual(keys(CORE_LABELS_IT));
  });

  it('CoreLabelsService segue environment.language', () => {
    const environment = signal<{ language?: string } | null>(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: SystemService, useValue: { environment } },
        { provide: LIB_LABELS, useValue: { en: { card: { action: 'Go' } } } },
      ],
    });
    const labels = TestBed.inject(CoreLabelsService).labels;
    expect(labels().card.action).toBe('Procedi');
    environment.set({ language: 'en' });
    expect(labels().card.action).toBe('Go');
    expect(labels().paginator.rangeLabel(1, 10, 25)).toBe('11 – 20 of 25');
  });
});
