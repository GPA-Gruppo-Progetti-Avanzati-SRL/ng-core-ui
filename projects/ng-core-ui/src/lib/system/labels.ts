import { InjectionToken } from '@angular/core';

/** Testi della libreria. La lingua viene da `environment.language` (default `it`). */
export interface CoreLabels {
  browserTitle: { loading: string; error: string };
  errorPage: { title: string; message: string; contact: string; retry: string };
  notFound: { title: string; message: string };
  forbidden: { title: string; message: string };
  layout: { menuToggle: string; primaryNav: string; logout: string; appsMenu: string; home: string; version: string };
  confirm: { title: string; confirm: string; cancel: string };
  alert: { title: string; close: string };
  toast: { close: string };
  card: { action: string; unavailable: string };
  topbar: { actions: string };
  datatable: { loadError: string; retry: string; empty: string };
  field: {
    invalid: string;
    noFile: string;
    filesSelected: (n: number) => string;
    selectFile: string;
    clearFile: string;
    clearSelection: string;
    select: (label: string) => string;
  };
  picker: { title: string; search: string; description: string; cancel: string; confirm: string; close: string };
  kvOptions: { loadError: string };
  paginator: {
    itemsPerPage: string;
    nextPage: string;
    previousPage: string;
    firstPage: string;
    lastPage: string;
    rangeLabel: (page: number, pageSize: number, length: number) => string;
  };
}

/** Override parziali per lingua, es. `{ it: { datatable: { empty: 'Nessuna pratica' } } }`. */
export type CoreLabelsOverrides = Record<string, { [K in keyof CoreLabels]?: Partial<CoreLabels[K]> }>;

const range = (of: string) => (page: number, pageSize: number, length: number) => {
  if (length === 0) return `0 ${of} 0`;
  const start = page * pageSize;
  return `${start + 1} – ${Math.min(start + pageSize, length)} ${of} ${length}`;
};

export const CORE_LABELS_IT: CoreLabels = {
  browserTitle: { loading: 'Caricamento...', error: 'Errore' },
  errorPage: {
    title: 'Servizio non disponibile',
    message: "Impossibile avviare l'applicazione.",
    contact: "Se il problema persiste, contattare l'amministratore di sistema.",
    retry: 'Riprova',
  },
  notFound: { title: 'Pagina non trovata', message: 'La pagina richiesta non esiste.' },
  forbidden: { title: 'Accesso negato', message: 'Non hai i permessi per accedere a questa risorsa.' },
  layout: {
    menuToggle: 'Apri/Chiudi menu',
    primaryNav: 'Menu principale',
    logout: 'Esci',
    appsMenu: 'Apri il menu delle applicazioni',
    home: 'Vai alla home',
    version: 'Versione',
  },
  confirm: { title: 'Conferma', confirm: 'Conferma', cancel: 'Annulla' },
  alert: { title: 'Avviso', close: 'Chiudi' },
  toast: { close: 'Chiudi notifica' },
  card: { action: 'Procedi', unavailable: 'Non disponibile' },
  topbar: { actions: 'Azioni' },
  datatable: { loadError: 'Errore durante il caricamento dei dati', retry: 'Riprova', empty: 'Nessun dato' },
  field: {
    invalid: 'Campo non valido',
    noFile: 'Nessun file selezionato',
    filesSelected: n => `${n} file selezionati`,
    selectFile: 'Seleziona file',
    clearFile: 'Annulla selezione file',
    clearSelection: 'Rimuovi selezione',
    select: label => `Seleziona ${label}`.trim(),
  },
  picker: { title: 'Seleziona', search: 'Cerca', description: 'Descrizione', cancel: 'Annulla', confirm: 'Conferma', close: 'Chiudi' },
  kvOptions: { loadError: 'Errore nel caricamento delle opzioni' },
  paginator: {
    itemsPerPage: 'Righe per pagina:',
    nextPage: 'Pagina successiva',
    previousPage: 'Pagina precedente',
    firstPage: 'Prima pagina',
    lastPage: 'Ultima pagina',
    rangeLabel: range('di'),
  },
};

export const CORE_LABELS_EN: CoreLabels = {
  browserTitle: { loading: 'Loading...', error: 'Error' },
  errorPage: {
    title: 'Service unavailable',
    message: 'The application could not be started.',
    contact: 'If the problem persists, contact your system administrator.',
    retry: 'Retry',
  },
  notFound: { title: 'Page not found', message: 'The requested page does not exist.' },
  forbidden: { title: 'Access denied', message: 'You are not allowed to access this resource.' },
  layout: {
    menuToggle: 'Toggle menu',
    primaryNav: 'Main menu',
    logout: 'Log out',
    appsMenu: 'Open the applications menu',
    home: 'Go to home',
    version: 'Version',
  },
  confirm: { title: 'Confirm', confirm: 'Confirm', cancel: 'Cancel' },
  alert: { title: 'Notice', close: 'Close' },
  toast: { close: 'Close notification' },
  card: { action: 'Open', unavailable: 'Not available' },
  topbar: { actions: 'Actions' },
  datatable: { loadError: 'Error while loading data', retry: 'Retry', empty: 'No data' },
  field: {
    invalid: 'Invalid value',
    noFile: 'No file selected',
    filesSelected: n => `${n} files selected`,
    selectFile: 'Select file',
    clearFile: 'Clear file selection',
    clearSelection: 'Clear selection',
    select: label => `Select ${label}`.trim(),
  },
  picker: { title: 'Select', search: 'Search', description: 'Description', cancel: 'Cancel', confirm: 'Confirm', close: 'Close' },
  kvOptions: { loadError: 'Error while loading options' },
  paginator: {
    itemsPerPage: 'Items per page:',
    nextPage: 'Next page',
    previousPage: 'Previous page',
    firstPage: 'First page',
    lastPage: 'Last page',
    rangeLabel: range('of'),
  },
};

const DICTIONARIES: Record<string, CoreLabels> = { it: CORE_LABELS_IT, en: CORE_LABELS_EN };

/** Override dei testi per lingua; valorizzato da `provideGPAUICore({ labels })`. */
export const LIB_LABELS = new InjectionToken<CoreLabelsOverrides>('LIB_LABELS', { factory: () => ({}) });

/** `it-IT` → `it`; lingue senza dizionario → `it`. */
export function labelsLanguage(language: string | null | undefined): string {
  const lang = (language ?? 'it').toLowerCase().split(/[-_]/)[0];
  return lang in DICTIONARIES ? lang : 'it';
}

/** Dizionario della lingua con gli override applicati sezione per sezione. */
export function resolveLabels(language: string | null | undefined, overrides: CoreLabelsOverrides = {}): CoreLabels {
  const lang = labelsLanguage(language);
  const base = DICTIONARIES[lang];
  const custom = overrides[lang] ?? overrides[(language ?? '').toLowerCase()] ?? {};
  const merged = { ...base } as Record<string, unknown>;
  for (const [section, values] of Object.entries(custom)) {
    merged[section] = { ...(base as unknown as Record<string, object>)[section], ...values };
  }
  return merged as unknown as CoreLabels;
}
