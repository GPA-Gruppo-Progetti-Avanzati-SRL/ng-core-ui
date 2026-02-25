import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GpaUiCore } from './gpa-ui-core';

describe('GpaUiCore', () => {
  let component: GpaUiCore;
  let fixture: ComponentFixture<GpaUiCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GpaUiCore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GpaUiCore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
