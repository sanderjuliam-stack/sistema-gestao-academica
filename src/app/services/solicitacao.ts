import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { SolicitacaoDocumento, StatusEmissao } from '../models/solicitacao';

@Injectable({
  providedIn: 'root',
})
export class SolicitacaoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/solicitacoes`;
  private readonly usarMock = environment.usarMock;

  private mockSolicitacoes: SolicitacaoDocumento[] = [
    {
      id: 1,
      alunoId: 1,
      cursoId: 1,
      alunoNome: 'Ana Clara Silva',
      alunoCpf: '12345678901',
      cursoNome: 'Pós-Graduação em Engenharia de Software',
      tipoDocumento: 'CERTIFICADO',
      dataSolicitacao: '2026-08-15',
      statusEmissao: 'EMITIDO',
      dataEmissao: '2026-07-15',
      entregue: true,
      dataEntrega: '2026-07-16',
      formaEntrega: 'E-MAIL',
    },
    {
      id: 2,
      alunoId: 1,
      cursoId: 1,
      alunoNome: 'Ana Clara Silva',
      alunoCpf: '12345678901',
      cursoNome: 'Pós-Graduação em Engenharia de Software',
      tipoDocumento: 'DECLARACAO_CONCLUSAO',
      dataSolicitacao: '2026-06-20',
      statusEmissao: 'EMITIDO',
      dataEmissao: '2026-07-15',
      entregue: false,
    },
    {
      id: 3,
      alunoId: 2,
      cursoId: 1,
      alunoNome: 'Clara Silva',
      alunoCpf: '12312312312',
      cursoNome: 'Pós-Graduação em Engenharia de Software',
      tipoDocumento: 'CERTIFICADO',
      dataSolicitacao: '2026-07-10',
      statusEmissao: 'PENDENTE',
      dataEmissao: '2026-07-15',
      entregue: false,
    },
  ];

  getSolicitacoes(): Observable<SolicitacaoDocumento[]> {
    if (this.usarMock) {
      return of(structuredClone(this.mockSolicitacoes));
    }
    return this.http.get<SolicitacaoDocumento[]>(this.apiUrl);
  }

  criarSolicitacao(solicitacao: Omit<SolicitacaoDocumento, 'id'>): Observable<SolicitacaoDocumento> {
    if (this.usarMock) {
      const nova: SolicitacaoDocumento = { ...structuredClone(solicitacao), id: Date.now() };
      this.mockSolicitacoes = [nova, ...this.mockSolicitacoes];
      return of(structuredClone(nova));
    }
    return this.http.post<SolicitacaoDocumento>(this.apiUrl, solicitacao);
  }

  atualizarStatus(id: number, statusEmissao: StatusEmissao): Observable<SolicitacaoDocumento> {
    if (this.usarMock) {
      const item = this.mockSolicitacoes.find((s) => s.id === id);
      if (!item) {
        return throwError(() => new Error('Solicitação não encontrada.'));
      }
      item.statusEmissao = statusEmissao;
      return of(structuredClone(item));
    }
    return this.http.patch<SolicitacaoDocumento>(`${this.apiUrl}/${id}/status`, { statusEmissao });
  }

  toggleEntrega(id: number, entregue: boolean, dataEntrega?: string): Observable<SolicitacaoDocumento> {
    if (this.usarMock) {
      const item = this.mockSolicitacoes.find((s) => s.id === id);
      if (!item) {
        return throwError(() => new Error('Solicitação não encontrada.'));
      }
      item.entregue = entregue;
      item.dataEntrega = dataEntrega;
      return of(structuredClone(item));
    }
    return this.http.patch<SolicitacaoDocumento>(`${this.apiUrl}/${id}/entrega`, { entregue, dataEntrega });
  }

  deletarSolicitacao(id: number): Observable<void> {
    if (this.usarMock) {
      this.mockSolicitacoes = this.mockSolicitacoes.filter((item) => item.id !== id);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deletarSolicitacoes(ids: number[]): Observable<void> {
    if (this.usarMock) {
      this.mockSolicitacoes = this.mockSolicitacoes.filter((item) => !ids.includes(item.id));
      return of(undefined);
    }
    return this.http.post<void>(`${this.apiUrl}/deletar-lote`, { ids });
  }
}