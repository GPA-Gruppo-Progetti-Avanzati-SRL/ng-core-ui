export const LIB = '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

// Versioni target lette dal campo ng-add.targetVersions del package.json della libreria.
// Le peerDependencies dichiarano il major supportato (^22): su un'app a un major precedente
// `ng add` richiede prima `ng update @angular/core @angular/cli` (o `--legacy-peer-deps`).
// I valori esatti da impostare nell'app consumatrice stanno qui.
export const LIB_TARGET_VERSIONS: Record<string, string> =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (require('../../package.json') as { 'ng-add'?: { targetVersions?: Record<string, string> } })['ng-add']?.targetVersions ?? {};
