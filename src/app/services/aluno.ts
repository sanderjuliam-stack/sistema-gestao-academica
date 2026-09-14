import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Aluno } from '../models/aluno';

@Injectable({
  providedIn: 'root',
})
export class AlunoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/alunos`;
  private readonly usarMock = environment.usarMock;

  private mockAlunos: Aluno[] = [
    {
      id: 1,
      nome: 'Ana Clara Silva',
      cpf: '12345678901',
      email: 'ana.silva@email.com',
      dataNascimento: '1998-05-14',
      naturalidadeCidade: 'Belo Horizonte',
      naturalidadeUf: 'MG',
      matriculas: [
        {
          id: 1,
          alunoId: 1,
          cursoId: 1,
          cursoNome: 'Pós-Graduação em Engenharia de Software',
          dataInicio: '2025-03-01',
          dataTermino: '2028-03-01',
          frequenciaGeralPct: 92.5,
          linkDocumentos: 'https://drive.google.com/drive',
          documentos: [
            {
              id: 'doc-1',
              nome: 'historico_graduacao.pdf',
              url: 'https://storage.local/docs/historico.pdf',
              dataUpload: '2025-03-02',
              tipo: 'HISTORICO',
            },
            {
              id: 'doc-2',
              nome: 'rg_frente_verso.pdf',
              url: 'https://storage.local/docs/rg.pdf',
              dataUpload: '2025-03-02',
              tipo: 'RG',
            },
          ],
          tcc: {
            titulo: 'Arquiteturas Serverless Aplicadas no Setor Financeiro',
            tema: 'Cloud Computing',
            tipoTrabalho: 'MONOGRAFIA',
          },
          notasDisciplinas: [
            { disciplinaId: 1, disciplinaNome: 'Arquitetura de Software', notaFinal: 80 },
            { disciplinaId: 2, disciplinaNome: 'DevOps & CI/CD', notaFinal: 70 },
          ],
        },
      ],
    },
    {
      id: 2,
      nome: 'Clara Silva',
      cpf: '12312312312',
      email: 'clara.silva@email.com',
      dataNascimento: '2000-05-14',
      naturalidadeCidade: 'Belo Horizonte',
      naturalidadeUf: 'MG',
      matriculas: [
        {
          id: 2,
          alunoId: 2,
          cursoId: 1,
          cursoNome: 'Pós-Graduação em Engenharia de Software',
          dataInicio: '2025-03-01',
          dataTermino: '2028-03-01',
          frequenciaGeralPct: 60.5,
          linkDocumentos: 'https://drive.google.com/drive',
          documentos: [
            {
              id: 'doc-1',
              nome: 'historico_graduacao.pdf',
              url: 'https://storage.local/docs/historico.pdf',
              dataUpload: '2025-03-02',
              tipo: 'HISTORICO',
            },
          ],
          tcc: {
            titulo: 'Arquiteturas Serverless Aplicadas no Setor Financeiro',
            tema: 'Cloud Computing',
            tipoTrabalho: 'Monografia',
          },
          notasDisciplinas: [
            { disciplinaId: 1, disciplinaNome: 'Arquitetura de Software', notaFinal: 70 },
            { disciplinaId: 2, disciplinaNome: 'DevOps & CI/CD', notaFinal: 20 },
          ],
        },
      ],
    },
  ];

  getAlunos(): Observable<Aluno[]> {
    if (this.usarMock) {
      return of(structuredClone(this.mockAlunos));
    }
    return this.http.get<Aluno[]>(this.apiUrl);
  }

  getAlunoPorId(id: number): Observable<Aluno | undefined> {
    if (this.usarMock) {
      const aluno = this.mockAlunos.find((a) => a.id === id);
      return of(aluno ? structuredClone(aluno) : undefined);
    }
    return this.http.get<Aluno>(`${this.apiUrl}/${id}`);
  }

  cadastrarAluno(aluno: Omit<Aluno, 'id'>): Observable<Aluno> {
    if (this.usarMock) {
      const novoAluno: Aluno = { ...structuredClone(aluno), id: Date.now() };
      this.mockAlunos = [novoAluno, ...this.mockAlunos];
      return of(structuredClone(novoAluno));
    }
    return this.http.post<Aluno>(this.apiUrl, aluno);
  }

  atualizarAluno(aluno: Aluno): Observable<Aluno> {
    if (this.usarMock) {
      this.mockAlunos = this.mockAlunos.map((item) => (item.id === aluno.id ? structuredClone(aluno) : item));
      return of(structuredClone(aluno));
    }
    return this.http.put<Aluno>(`${this.apiUrl}/${aluno.id}`, aluno);
  }

  deletarAluno(id: number): Observable<void> {
    if (this.usarMock) {
      this.mockAlunos = this.mockAlunos.filter((item) => item.id !== id);
      return of(undefined);
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deletarAlunos(ids: number[]): Observable<void> {
    if (this.usarMock) {
      this.mockAlunos = this.mockAlunos.filter((item) => !ids.includes(item.id));
      return of(undefined);
    }
    return this.http.post<void>(`${this.apiUrl}/deletar-lote`, { ids });
  }
}