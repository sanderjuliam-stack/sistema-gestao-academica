import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Instituicoes } from './instituicoes';

describe('Instituicoes', () => {
  let component: Instituicoes;
  let fixture: ComponentFixture<Instituicoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Instituicoes],
    }).compileComponents();

    fixture = TestBed.createComponent(Instituicoes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
