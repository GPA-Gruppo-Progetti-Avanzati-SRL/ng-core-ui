import { TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { required } from '@angular/forms/signals';
import { FormModel } from './form-field.models';
import { TextInputFieldComponent } from './fields/text-input-field.component';

interface Person { nome: string; indirizzo: { citta: string } }

describe('FormModel.submit', () => {
  function makeModel(value: Person) {
    return runInInjectionContext(TestBed.inject(Injector), () =>
      new FormModel<Person>(
        value,
        p => { required(p.nome); required(p.indirizzo.citta); },
        ft => [{ field: ft.nome, label: 'Nome', component: TextInputFieldComponent }],
      ),
    );
  }

  it('form invalido: non esegue l\'azione e marca touched anche i campi fuori dal layout', async () => {
    const m = makeModel({ nome: '', indirizzo: { citta: '' } });
    const action = jasmine.createSpy('action');
    expect(await m.submit(action)).toBeFalse();
    expect(action).not.toHaveBeenCalled();
    expect(m.ft.nome().touched()).toBeTrue();
    expect(m.ft.indirizzo.citta().touched()).withContext('campo annidato, non nel layout').toBeTrue();
  });

  it('form valido: esegue l\'azione', async () => {
    const m = makeModel({ nome: 'Ada', indirizzo: { citta: 'Roma' } });
    const action = jasmine.createSpy('action');
    expect(await m.submit(action)).toBeTrue();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('doppio click durante un\'azione asincrona: l\'azione parte una volta sola', async () => {
    const m = makeModel({ nome: 'Ada', indirizzo: { citta: 'Roma' } });
    let release!: () => void;
    const action = jasmine.createSpy('action').and.returnValue(new Promise<void>(r => (release = r)));

    const first = m.submit(action);
    expect(m.submitting()).toBeTrue();
    expect(await m.submit(action)).withContext('secondo click ignorato').toBeFalse();
    release();
    expect(await first).toBeTrue();
    expect(action).toHaveBeenCalledTimes(1);
    expect(m.submitting()).toBeFalse();
  });

  it('errori ritornati dall\'azione finiscono sul campo come errori server', async () => {
    const m = makeModel({ nome: 'Ada', indirizzo: { citta: 'Roma' } });
    const ok = await m.submit(() => [{ kind: 'server', message: 'Nome già usato', fieldTree: m.ft.nome }]);
    expect(ok).toBeFalse();
    expect(m.ft.nome().errors().map(e => e.message)).toContain('Nome già usato');
  });
});
