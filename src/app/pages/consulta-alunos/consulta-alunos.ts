import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

import { Aluno, Matricula } from '../../models/aluno';
import { ColunaTabela } from '../../models/coluna-tabela';
import { Curso } from '../../models/curso';
import { SolicitacaoDocumento } from '../../models/solicitacao';
import { AlunoService } from '../../services/aluno';
import { CursoService } from '../../services/curso';
import { SolicitacaoService } from '../../services/solicitacao';
import {
  RepositorioDialogData,
  RepositorioDocumentosDialogComponent,
} from '../../shared/components/repositorio-documentos-dialog';

export type StatusDocGeral = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';

@Component({
  selector: 'app-consulta-alunos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSidenavModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './consulta-alunos.html',
  styleUrl: './consulta-alunos.scss',
})
export class ConsultaAlunosComponent implements OnInit {
  private readonly alunoService = inject(AlunoService);
  private readonly cursoService = inject(CursoService);
  private readonly solicitacaoService = inject(SolicitacaoService);
  private readonly dialog = inject(MatDialog);

  readonly todosAlunos = signal<Aluno[]>([]);
  readonly todosCursos = signal<Curso[]>([]);
  readonly todasSolicitacoes = signal<SolicitacaoDocumento[]>([]);

  readonly termoBusca = signal<string>('');
  readonly filtroStatusDoc = signal<string>('');
  readonly filtroDataSolicitacaoInicio = signal<string>('');
  readonly filtroDataSolicitacaoFim = signal<string>('');

  readonly alunoSelecionado = signal<Aluno | null>(null);

  // COLUNAS OBRIGATÓRIAS
  readonly colunasObrigatorias = ['nome', 'cpf', 'curso', 'situacaoDocumentacao'];

  // LISTA DE COLUNAS OPCIONAIS
  readonly colunasOpcionais = signal<ColunaTabela[]>([
    { id: 'email', label: 'E-mail', visivel: false },
    { id: 'dataNascimento', label: 'Data de Nascimento', visivel: false },
    { id: 'naturalidadeCidade', label: 'Cidade Natal', visivel: false },
    { id: 'naturalidadeUf', label: 'UF', visivel: false },
    { id: 'areaConhecimento', label: 'Área do Conhecimento', visivel: false },
    { id: 'cargaHorariaTotal', label: 'Carga Horária Total', visivel: false },
    { id: 'frequenciaGeral', label: 'Frequência Geral', visivel: false },
    { id: 'dataInicio', label: 'Data Início', visivel: false },
    { id: 'dataTermino', label: 'Data Término', visivel: false },
    { id: 'linkDrive', label: 'Link Pasta Drive', visivel: false },
    { id: 'repoLocalDocs', label: 'Repo Docs', visivel: true },

    // Declaração
    { id: 'decStatus', label: 'Declaração: Status', visivel: false },
    { id: 'decDataEmissao', label: 'Declaração: Data Emissão', visivel: false },
    { id: 'decEntregue', label: 'Declaração: Entregue', visivel: false },
    { id: 'decFormaEntrega', label: 'Declaração: Forma Entrega', visivel: false },
    { id: 'decObs', label: 'Declaração: Observações', visivel: false },

    // Certificado
    { id: 'certStatus', label: 'Certificado: Status', visivel: false },
    { id: 'certDataEmissao', label: 'Certificado: Data Emissão', visivel: false },
    { id: 'certEntregue', label: 'Certificado: Entregue', visivel: false },
    { id: 'certFormaEntrega', label: 'Certificado: Forma Entrega', visivel: false },
    { id: 'certObs', label: 'Certificado: Observações', visivel: false },

    // Acadêmico
    { id: 'mediasDisciplinas', label: 'Média Final Disciplinas', visivel: false },
    { id: 'tccInfo', label: 'TCC (Título, Tema, Tipo)', visivel: false },
  ]);

  readonly todasColunasVisiveis = computed(() => {
    const opcionaisVisiveis = this.colunasOpcionais()
      .filter((c) => c.visivel)
      .map((c) => c.id);
    return [...this.colunasObrigatorias, ...opcionaisVisiveis];
  });

  readonly totalColunasOpcionaisVisiveis = computed(
    () => this.colunasOpcionais().filter((c) => c.visivel).length
  );

  readonly alunosFiltrados = computed(() => {
    const busca = this.termoBusca().toLowerCase().trim();
    const statusDoc = this.filtroStatusDoc();
    const dataInicio = this.filtroDataSolicitacaoInicio();
    const dataFim = this.filtroDataSolicitacaoFim();

    return this.todosAlunos().filter((aluno) => {
      const matricula = aluno.matriculas?.[0];

      const matchBusca =
        !busca ||
        aluno.nome.toLowerCase().includes(busca) ||
        aluno.cpf.includes(busca) ||
        (matricula?.cursoNome && matricula.cursoNome.toLowerCase().includes(busca));

      const statusGeral = this.calcularStatusGeralDoc(aluno);
      const matchStatusDoc = !statusDoc || statusGeral === statusDoc;

      const solicitacoesDoAluno = this.todasSolicitacoes().filter(
        (s) => s.alunoCpf === aluno.cpf && s.cursoNome === matricula?.cursoNome
      );

      const matchPeriodoSolicitacao =
        (!dataInicio && !dataFim) ||
        solicitacoesDoAluno.some((s) => {
          const rawData = s.dataSolicitacao;
          if (!rawData) return false;

          const dataFormatada = rawData.substring(0, 10);
          const atendeInicio = !dataInicio || dataFormatada >= dataInicio;
          const atendeFim = !dataFim || dataFormatada <= dataFim;

          return atendeInicio && atendeFim;
        });

      return matchBusca && matchStatusDoc && matchPeriodoSolicitacao;
    });
  });

  ngOnInit(): void {
    forkJoin({
      alunos: this.alunoService.getAlunos(),
      cursos: this.cursoService.getCursos(),
      solicitacoes: this.solicitacaoService.getSolicitacoes(),
    }).subscribe(({ alunos, cursos, solicitacoes }) => {
      this.todosAlunos.set(alunos);
      this.todosCursos.set(cursos);
      this.todasSolicitacoes.set(solicitacoes);
    });
  }

  abrirRepositorioDocumentos(aluno: Aluno, matricula?: Matricula): void {
    const mat = matricula || aluno.matriculas?.[0];
    if (!mat) return;

    const dialogRef = this.dialog.open(RepositorioDocumentosDialogComponent, {
      width: '580px',
      data: {
        aluno,
        matricula: mat,
      } as RepositorioDialogData,
    });

    dialogRef.afterClosed().subscribe((alunoAtualizado: Aluno | undefined) => {
      if (alunoAtualizado) {
        this.todosAlunos.update((lista) =>
          lista.map((a) => (a.id === alunoAtualizado.id ? alunoAtualizado : a))
        );

        if (this.alunoSelecionado()?.id === alunoAtualizado.id) {
          this.alunoSelecionado.set(alunoAtualizado);
        }
      }
    });
  }

  obterAreaConhecimento(matricula?: Matricula): string {
    if (!matricula) return '-';
    const curso = this.todosCursos().find((c) => c.id === matricula.cursoId);
    return curso?.areaConhecimento || '-';
  }

  obterCargaHoraria(matricula?: Matricula): string {
    if (!matricula) return '-';
    const curso = this.todosCursos().find((c) => c.id === matricula.cursoId);
    return curso?.cargaHorariaTotal ? `${curso.cargaHorariaTotal}h` : '-';
  }

  calcularStatusGeralDoc(aluno: Aluno): StatusDocGeral {
    const status = this.obterStatusDocumentos(aluno);
    if (status.declaracaoEntregue && status.certificadoEntregue) {
      return 'CONCLUIDO';
    }
    if (status.declaracaoEntregue || status.certificadoEntregue) {
      return 'EM_ANDAMENTO';
    }
    return 'PENDENTE';
  }

  obterStatusDocumentos(aluno: Aluno) {
    const matricula = aluno.matriculas?.[0];
    if (!matricula) {
      return {
        declaracaoEntregue: false,
        certificadoEntregue: false,
        solicitacaoDeclaracao: undefined,
        solicitacaoCertificado: undefined,
      };
    }

    const solicitacoesDoAluno = this.todasSolicitacoes().filter(
      (s) => s.alunoCpf === aluno.cpf && s.cursoNome === matricula.cursoNome
    );

    const solDeclaracao = solicitacoesDoAluno.find(
      (s) => s.tipoDocumento === 'DECLARACAO_CONCLUSAO'
    );
    const solCertificado = solicitacoesDoAluno.find(
      (s) => s.tipoDocumento === 'CERTIFICADO'
    );

    return {
      declaracaoEntregue: solDeclaracao?.entregue ?? false,
      certificadoEntregue: solCertificado?.entregue ?? false,
      solicitacaoDeclaracao: solDeclaracao,
      solicitacaoCertificado: solCertificado,
    };
  }

  formatarMediasDisciplinas(aluno: Aluno): string {
    const notas = aluno.matriculas?.[0]?.notasDisciplinas;
    if (!notas || notas.length === 0) return '-';
    return notas.map((n) => `${n.disciplinaNome}: ${n.notaFinal ?? 'N/A'}`).join(' | ');
  }

  formatarTcc(aluno: Aluno): string {
    const tcc = aluno.matriculas?.[0]?.tcc;
    if (!tcc || (!tcc.titulo && !tcc.tema && !tcc.tipoTrabalho)) return '-';
    const tipo = tcc.tipoTrabalho ? `[${tcc.tipoTrabalho}] ` : '';
    const titulo = tcc.titulo || 'Sem título';
    const tema = tcc.tema ? ` (Tema: ${tcc.tema})` : '';
    return `${tipo}${titulo}${tema}`;
  }

  selecionarAluno(aluno: Aluno): void {
    this.alunoSelecionado.set(aluno);
  }

  alternarVisibilidadeColuna(idColuna: string): void {
    this.colunasOpcionais.update((cols) =>
      cols.map((c) => (c.id === idColuna ? { ...c, visivel: !c.visivel } : c))
    );
  }

  reordenarColunas(event: CdkDragDrop<string[]>): void {
    const listaAtualizada = [...this.colunasOpcionais()];
    moveItemInArray(listaAtualizada, event.previousIndex, event.currentIndex);
    this.colunasOpcionais.set(listaAtualizada);
  }

  resetarColunas(): void {
    this.colunasOpcionais.update((cols) =>
      cols.map((c) => ({ ...c, visivel: c.id === 'linkDrive' }))
    );
  }

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroStatusDoc.set('');
    this.filtroDataSolicitacaoInicio.set('');
    this.filtroDataSolicitacaoFim.set('');
  }

  exportarExcel(): void {
    const dados = this.alunosFiltrados();
    if (dados.length === 0) return;

    const mapaRotulos: Record<string, string> = {
      nome: 'Nome',
      cpf: 'CPF',
      curso: 'Curso',
      situacaoDocumentacao: 'Situação Documentação',
      email: 'E-mail',
      dataNascimento: 'Data de Nascimento',
      naturalidadeCidade: 'Cidade Natal',
      naturalidadeUf: 'UF',
      areaConhecimento: 'Área do Conhecimento',
      cargaHorariaTotal: 'Carga Horária',
      frequenciaGeral: 'Frequência Geral',
      dataInicio: 'Data Início',
      dataTermino: 'Data Término',
      linkDrive: 'Link Pasta Drive',
      repoLocalDocs: 'Links Repositorio Docs',
      decStatus: 'Declaração: Status',
      decDataEmissao: 'Declaração: Data Emissão',
      decEntregue: 'Declaração: Entregue',
      decFormaEntrega: 'Declaração: Forma Entrega',
      decObs: 'Declaração: Observações',
      certStatus: 'Certificado: Status',
      certDataEmissao: 'Certificado: Data Emissão',
      certEntregue: 'Certificado: Entregue',
      certFormaEntrega: 'Certificado: Forma Entrega',
      certObs: 'Certificado: Observações',
      mediasDisciplinas: 'Média Final Disciplinas',
      tccInfo: 'TCC (Título, Tema, Tipo)',
    };

    const colunasVisiveis = this.todasColunasVisiveis();

    const dadosExportacao = dados.map((aluno) => {
      const mat = aluno.matriculas?.[0];
      const statusDoc = this.obterStatusDocumentos(aluno);
      const linha: Record<string, string | number> = {};

      colunasVisiveis.forEach((colId) => {
        const headerName = mapaRotulos[colId] || colId;

        switch (colId) {
          case 'nome':
            linha[headerName] = aluno.nome;
            break;
          case 'cpf':
            linha[headerName] = aluno.cpf;
            break;
          case 'curso':
            linha[headerName] = mat?.cursoNome || '-';
            break;
          case 'situacaoDocumentacao':
            linha[headerName] = this.calcularStatusGeralDoc(aluno);
            break;
          case 'email':
            linha[headerName] = aluno.email || '-';
            break;
          case 'dataNascimento':
            linha[headerName] = aluno.dataNascimento || '-';
            break;
          case 'naturalidadeCidade':
            linha[headerName] = aluno.naturalidadeCidade || '-';
            break;
          case 'naturalidadeUf':
            linha[headerName] = aluno.naturalidadeUf || '-';
            break;
          case 'areaConhecimento':
            linha[headerName] = this.obterAreaConhecimento(mat);
            break;
          case 'cargaHorariaTotal':
            linha[headerName] = this.obterCargaHoraria(mat);
            break;
          case 'frequenciaGeral':
            linha[headerName] = mat?.frequenciaGeralPct != null ? `${mat.frequenciaGeralPct}%` : '-';
            break;
          case 'dataInicio':
            linha[headerName] = mat?.dataInicio || '-';
            break;
          case 'dataTermino':
            linha[headerName] = mat?.dataTermino || '-';
            break;
          case 'linkDrive':
            linha[headerName] = mat?.linkDocumentos || '-';
            break;
          case 'repoLocalDocs':
            const docs = mat?.documentos;
            if (docs && docs.length > 0) {
              linha[headerName] = docs.map((d) => d.url || d.nome || '-').join(' | ');
            } else {
              linha[headerName] = '-';
            }
            break;
          case 'decStatus':
            linha[headerName] = statusDoc.solicitacaoDeclaracao?.statusEmissao || 'NÃO SOLICITADO';
            break;
          case 'decDataEmissao':
            linha[headerName] = statusDoc.solicitacaoDeclaracao?.dataEmissao || '-';
            break;
          case 'decEntregue':
            linha[headerName] = statusDoc.declaracaoEntregue ? 'Sim' : 'Não';
            break;
          case 'decFormaEntrega':
            linha[headerName] = statusDoc.solicitacaoDeclaracao?.formaEntrega || '-';
            break;
          case 'decObs':
            linha[headerName] = statusDoc.solicitacaoDeclaracao?.observacoes || '-';
            break;
          case 'certStatus':
            linha[headerName] = statusDoc.solicitacaoCertificado?.statusEmissao || 'NÃO SOLICITADO';
            break;
          case 'certDataEmissao':
            linha[headerName] = statusDoc.solicitacaoCertificado?.dataEmissao || '-';
            break;
          case 'certEntregue':
            linha[headerName] = statusDoc.certificadoEntregue ? 'Sim' : 'Não';
            break;
          case 'certFormaEntrega':
            linha[headerName] = statusDoc.solicitacaoCertificado?.formaEntrega || '-';
            break;
          case 'certObs':
            linha[headerName] = statusDoc.solicitacaoCertificado?.observacoes || '-';
            break;
          case 'mediasDisciplinas':
            linha[headerName] = this.formatarMediasDisciplinas(aluno);
            break;
          case 'tccInfo':
            linha[headerName] = this.formatarTcc(aluno);
            break;
          default:
            linha[headerName] = '-';
        }
      });

      return linha;
    });

    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);

    const colWidths = colunasVisiveis.map((colId) => {
      const headerName = mapaRotulos[colId] || colId;
      let maxLen = headerName.length;

      dadosExportacao.forEach((row) => {
        const val = row[headerName] ? String(row[headerName]) : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });

      return { wch: Math.min(Math.max(maxLen + 3, 12), 60) };
    });

    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos Documentação');

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `alunos_documentacao_${dataAtual}.xlsx`);
  }
}