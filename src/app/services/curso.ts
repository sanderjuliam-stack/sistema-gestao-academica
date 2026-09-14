import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Curso } from '../models/curso';

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cursos`;
  private readonly usarMock = environment.usarMock;

  private mockCursos: Curso[] = [
    {
      id: 1,
      nome: 'Pós-Graduação em Engenharia de Software',
      nivel: 'POS_GRADUACAO',
      instituicao: 'UNI',
      cargaHorariaTotal: 360,
      areaConhecimento: 'TI',
      possuiTcc: true,
      disciplinas: [
        { id: 1, nome: 'Arquitetura de Software', cargaHoraria: 60, docenteId: 1, docenteNome: 'Dr. Carlos Eduardo' },
        { id: 2, nome: 'DevOps & CI/CD', cargaHoraria: 40, docenteId: 2, docenteNome: 'Me. Ana Souza' },
      ],
    },
    {
      id: 2,
      nome: 'Ciência de Dados',
      nivel: 'POS_GRADUACAO',
      cargaHorariaTotal: 400,
      instituicao: 'UNI2',
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

  deletarCursos(ids: number[]): Observable<void> {
    if (this.usarMock) {
      this.mockCursos = this.mockCursos.filter((item) => !ids.includes(item.id));
      return of(undefined);
    }
    return this.http.post<void>(`${this.apiUrl}/deletar-lote`, { ids });
  }
}