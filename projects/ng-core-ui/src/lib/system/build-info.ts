declare const AppSha: string | undefined;
declare const AppVersion: string | undefined;

/**
 * Versione e SHA iniettati dal build (`ng build --define "AppVersion='…'" --define "AppSha='…'"`).
 * Con `ng serve` o nei test le globali non esistono: `typeof` evita il ReferenceError e si
 * ripiega su 'dev'.
 */
export const BUILD_INFO: { readonly version: string; readonly sha: string } = {
  version: typeof AppVersion !== 'undefined' ? AppVersion : 'dev',
  sha: typeof AppSha !== 'undefined' ? AppSha : 'dev',
};
