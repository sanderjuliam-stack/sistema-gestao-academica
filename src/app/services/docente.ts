import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Docente } from '../models/docente';

@Injectable({
  providedIn: 'root',
})
export class DocenteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/docentes`;
  private readonly usarMock = environment.usarMock;

  private mockDocentes: Docente[] = [
    { id: 1, nome: 'Dr. Carlos Eduardo', email: 'carlos.eduardo@univ.edu', titulacao: 'DOUTOR' },
    { id: 2, nome: 'Me. Ana Souza', email: 'ana.souza@univ.edu', titulacao: 'MESTRE' },
    { id: 3, nome: 'Dr. Roberto Lima', email: 'roberto.lima@univ.edu', titulacao: 'DOUTOR' },
  ];

  getDocentes(): Observable<Docente[]> {
    if (this.usarMock) {
      return of(structuredClone(this.mockDocentes));
    }
    return this.http.get<Docente[]>(this.apiUrl);
  }

  cadastrarDocente(docente: Omit<Docente, 'id'>): Observable<Docente> {
    if (this.usarMock) {
      const novoDocente: Docente = { ...structuredClone(docente), id: Date.now() };
      this.mockDocentes = [novoDocente, ...this.mockDocentes];
      return of(structuredClone(novoDocente));
    }
    return this.http.post<Docente>(this.apiUrl, docente);
  }

  atualizarDocente(docente: Docente): Observable<Docente> {
    if (this.usarMock) {
      this.mockDocentes = this.mockDocentes.map((item) => (item.id === docente.id ? structuredClone(docente) : item));
      return of(structuredClone(docente));
    }
    return this.http.put<Docente>(`${this.apiUrl}/${docente.id}`, docente);
  }

  deletarDocente(id: number): Observable<void> {
    if (this.usarMock) {
      this.mockDocentes = this.mockDocentes.filter((item) => item.id !== id);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deletarDocentes(ids: number[]): Observable<void> {
    if (this.usarMock) {
      this.mockDocentes = this.mockDocentes.filter((item) => !ids.includes(item.id));
      return of(undefined);
    }
    return this.http.post<void>(`${this.apiUrl}/deletar-lote`, { ids });
  }
}