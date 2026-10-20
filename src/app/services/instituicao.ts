import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Instituicao } from '../models/curso'; // Ou de '../models/instituicao' dependendo da sua estrutura

@Injectable({
  providedIn: 'root',
})
export class InstituicaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/instituicoes`;
  private readonly usarMock = environment.usarMock;

  private mockInstituicoes: Instituicao[] = [
    {
      id: 1,
      nome: 'Faculdade Central de Tecnologia',
      cnpj: '12.345.678/0001-90',
      telefone: '(11) 3000-0000',
    },
    {
      id: 2,
      nome: 'Instituto Universitário de Inovação',
      cnpj: '98.765.432/0001-10',
      telefone: '(31) 3333-4444',
    },
  ];

  getInstituicoes(): Observable<Instituicao[]> {
    if (this.usarMock) {
      return of(structuredClone(this.mockInstituicoes));
    }
    return this.http.get<Instituicao[]>(this.apiUrl);
  }

  cadastrarInstituicao(instituicao: Omit<Instituicao, 'id'>): Observable<Instituicao> {
    if (this.usarMock) {
      const novaInst: Instituicao = { ...structuredClone(instituicao), id: Date.now() };
      this.mockInstituicoes = [novaInst, ...this.mockInstituicoes];
      return of(structuredClone(novaInst));
    }
    return this.http.post<Instituicao>(this.apiUrl, instituicao);
  }

  atualizarInstituicao(instituicao: Instituicao): Observable<Instituicao> {
    if (this.usarMock) {
      this.mockInstituicoes = this.mockInstituicoes.map((item) =>
        item.id === instituicao.id ? structuredClone(instituicao) : item
      );
      return of(structuredClone(instituicao));
    }
    return this.http.put<Instituicao>(`${this.apiUrl}/${instituicao.id}`, instituicao);
  }

  deletarInstituicao(id: number): Observable<void> {
    if (this.usarMock) {
      this.mockInstituicoes = this.mockInstituicoes.filter((item) => item.id !== id);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}