import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaAlunos } from './consulta-alunos';

describe('ConsultaAlunos', () => {
  let component: ConsultaAlunos;
  let fixture: ComponentFixture<ConsultaAlunos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaAlunos],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaAlunos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
