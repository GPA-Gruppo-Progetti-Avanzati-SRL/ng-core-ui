export const LIB = '@gpa-gruppo-progetti-avanzati-srl/ng-core-ui';

// Versioni target lette dal campo ng-add.targetVersions del package.json della libreria.
// Le peerDependencies dichiarano range larghi (>=19) per non bloccare npm install;
// i valori esatti da impostare nell'app consumatrice stanno qui.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const LIB_TARGET_VERSIONS: Record<string, string> =
  (require('../../package.json') as { 'ng-add'?: { targetVersions?: Record<string, string> } })['ng-add']?.targetVersions ?? {};
