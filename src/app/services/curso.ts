import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Curso } from '../models/curso';
import { Instituicao } from '../models/curso';

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;
  private readonly usarMock = environment.usarMock;

  private mockInstituicoes: Instituicao[] = [
    { id: 1, nome: 'Faculdade Central de Tecnologia', cnpj: '12.345.678/0001-90' },
    { id: 2, nome: 'Instituto Universitário de Inovação', cnpj: '98.765.432/0001-10' },
  ];

  private mockCursos: Curso[] = [
    {
      id: 1,
      nome: 'Pós-Graduação em Engenharia de Software',
      nivel: 'POS_GRADUACAO',
      instituicao: this.mockInstituicoes[0],
      cargaHorariaTotal: 360,
      preco: 1200.00, // <-- Adicionado o preço para o cálculo financeiro
      areaConhecimento: 'TI',
      possuiTcc: true,
      disciplinas: [
        { id: 1, nome: 'Arquitetura de Software', cargaHoraria: 60, docenteId: 1, docenteNome: 'Dr. Carlos Eduardo' },
      ],
    },
    {
      id: 2,
      nome: 'Ciência de Dados',
      nivel: 'POS_GRADUACAO',
      instituicao: this.mockInstituicoes[1],
      cargaHorariaTotal: 400,
      preco: 1500.00, // <-- Adicionado o preço para o cálculo financeiro
      disciplinas: [
        { id: 3, nome: 'Machine Learning', cargaHoraria: 80, docenteId: 3, docenteNome: 'Dr. Roberto Lima' },
      ],
    },
  ];

  getCursos(): Observable<Curso[]> {
    if (this.usarMock) {
      return of(structuredClone(this.mockCursos));
    }
    return this.http.get<Curso[]>(this.apiUrl);
  }

  cadastrarCurso(curso: Omit<Curso, 'id'>): Observable<Curso> {
    if (this.usarMock) {
      const novoCurso: Curso = { ...structuredClone(curso), id: Date.now() };
      this.mockCursos = [novoCurso, ...this.mockCursos];
      return of(structuredClone(novoCurso));
    }
    return this.http.post<Curso>(this.apiUrl, curso);
  }

  atualizarCurso(curso: Curso): Observable<Curso> {
    if (this.usarMock) {
      this.mockCursos = this.mockCursos.map((item) => (item.id === curso.id ? structuredClone(curso) : item));
      return of(structuredClone(curso));
    }
    return this.http.put<Curso>(`${this.apiUrl}/${curso.id}`, curso);
  }

  deletarCurso(id: number): Observable<void> {
    if (this.usarMock) {
      this.mockCursos = this.mockCursos.filter((item) => item.id !== id);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}