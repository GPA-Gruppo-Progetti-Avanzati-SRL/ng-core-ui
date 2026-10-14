import { toRoutesList, toRoutesMongo, toRoutesSql, toRoutesYaml } from './routes-export';

const ROUTES = [
  { id: 'cap:app:ui:home', endpoint: '', description: 'Home', menu: true, order: 0 },
  { id: 'cap:app:ui:pratiche', endpoint: 'pratiche', description: 'Elenco "pratiche": aperte\\chiuse', icon: 'list' },
];
const ACTIONS = [{ id: 'cap:app:action:delete', description: "L'eliminazione" }];

describe('routes-export', () => {
  it('YAML: caratteri speciali (" : \\\\) nelle descrizioni restano scalari validi', () => {
    const yaml = toRoutesYaml(ROUTES, ACTIONS, 'app', 'App: gestione "pratiche"');
    expect(yaml).toContain('    description: "Elenco \\"pratiche\\": aperte\\\\chiuse"');
    expect(yaml).toContain('    description: "App: gestione \\"pratiche\\""');
    expect(yaml).toContain('    _id: "cap:app:ui:home"');
    expect(yaml).toContain('    endpoint: "/"');
    expect(yaml).toContain('    menu: true');
    expect(yaml).toContain('    order: 0');
    expect(yaml).toContain('    - "cap:app:action:delete"');
    // Ogni riga "chiave: valore" ha un valore che è JSON valido
    for (const line of yaml.split('\n').filter(l => /^\s+(-\s)?\w+: /.test(l) && !l.includes('category'))) {
      const value = line.replace(/^\s+(-\s)?\w+: /, '');
      expect(() => JSON.parse(value)).withContext(line).not.toThrow();
    }
  });

  it('SQL: apici raddoppiati', () => {
    expect(toRoutesSql(ROUTES, ACTIONS, 'app', 'x')).toContain("'L''eliminazione'");
    expect(toRoutesSql(ROUTES, ACTIONS, 'app', 'x', 'oracle')).toContain("'L''eliminazione' description");
  });

  it('Mongo: stringhe serializzate come JSON', () => {
    expect(toRoutesMongo(ROUTES, ACTIONS, 'app', 'x')).toContain('"description": "Elenco \\"pratiche\\": aperte\\\\chiuse"');
  });

  it('id duplicati fermano la generazione', () => {
    expect(() => toRoutesList([...ROUTES, ROUTES[0]])).toThrowError(/duplicate route\/action IDs/);
  });
});
