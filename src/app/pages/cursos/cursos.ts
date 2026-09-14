import { SelectionModel } from '@angular/cdk/collections';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs';

import { Aluno } from '../../models/aluno';
import { Curso } from '../../models/curso';
import { AlunoService } from '../../services/aluno';
import { CursoService } from '../../services/curso';
import { SolicitacaoService } from '../../services/solicitacao';
import { AvisoVinculoDialogComponent } from '../../shared/components/aviso-vinculo-dialog';
import { ExclusaoConfirmacaoDialogComponent } from '../../shared/components/exclusao-confirmacao-dialog';
import { NovoCursoDialogComponent } from './novo-curso-dialog';

@Component({
  selector: 'app-cursos',
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './cursos.html',
  styleUrl: './cursos.scss',
})
export class CursosComponent implements OnInit {
  private readonly cursoService = inject(CursoService);
  private readonly solicitacaoService = inject(SolicitacaoService);
  private readonly alunoService = inject(AlunoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly cursos = signal<Curso[]>([]);
  readonly termoBusca = signal<string>('');
  readonly dataSource = new MatTableDataSource<Curso>([]);

  // Modos de Seleção e Checkbox
  readonly modoSelecao = signal<boolean>(false);
  readonly selection = new SelectionModel<Curso>(true, []);

  readonly baseColumns: string[] = [
    'nome',
    'areaConhecimento',
    'instituicao',
    'nivel',
    'cargaHorariaTotal',
    'acoes',
  ];

  // Alterna dinamicamente a exibição da coluna de checkbox
  readonly displayedColumns = computed(() => {
    return this.modoSelecao() ? ['select', ...this.baseColumns] : this.baseColumns;
  });

  @ViewChild(MatPaginator) set paginator(p: MatPaginator) {
    this.dataSource.paginator = p;
  }

  @ViewChild(MatSort) set sort(s: MatSort) {
    this.dataSource.sort = s;
  }

  ngOnInit(): void {
    this.carregarCursos();
  }

  carregarCursos(): void {
    this.cursoService.getCursos().subscribe((dados) => {
      this.cursos.set(dados);
      this.atualizarTabela();
    });
  }

  aplicarFiltroTexto(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.termoBusca.set(valor);
    this.atualizarTabela();
  }

  private atualizarTabela(): void {
    const termo = this.termoBusca().trim().toLowerCase();

    const filtrados = this.cursos().filter(
      (c) =>
        !termo ||
        c.nome.toLowerCase().includes(termo) ||
        c.instituicao?.toLowerCase().includes(termo) ||
        c.areaConhecimento?.toLowerCase().includes(termo) ||
        c.nivel?.toLowerCase().includes(termo)
    );

    this.dataSource.data = filtrados;
  }

  // --- LÓGICA DE MODO DE SELEÇÃO MÚLTIPLA ---

  ativarModoSelecao(): void {
    this.modoSelecao.set(true);
  }

  cancelarModoSelecao(): void {
    this.modoSelecao.set(false);
    this.selection.clear();
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.filteredData.length;
    return numSelected === numRows && numRows > 0;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.filteredData);
  }

  // --- REGRA DE EXCLUSÃO COM VALIDAÇÃO DE VÍNCULOS ---

  abrirDialogDelecao(): void {
    const selecionados = this.selection.selected;
    if (selecionados.length === 0) return;

    // Consulta simultânea de solicitações e alunos para checar impedimentos
    forkJoin({
      solicitacoes: this.solicitacaoService.getSolicitacoes().pipe(catchError(() => of([]))),
      alunos: this.alunoService.getAlunos().pipe(catchError(() => of([]))),
    }).subscribe(({ solicitacoes, alunos }) => {
      const idsCursosSelecionados = selecionados.map((c) => c.id);
      const nomesCursosSelecionados = selecionados.map((c) => c.nome.toLowerCase());

      // 1. Filtra solicitações associadas aos cursos selecionados
      const solicitacoesAtreladas = solicitacoes.filter((s) =>
        s.cursoNome && nomesCursosSelecionados.includes(s.cursoNome.toLowerCase())
      );

      // 2. Filtra alunos que possuem matrícula vinculada aos cursos selecionados (por ID ou Nome)
      const alunosAtrelados = alunos.filter((aluno: Aluno) =>
        aluno.matriculas?.some(
          (m) =>
            idsCursosSelecionados.includes(m.cursoId) ||
            (m.cursoNome && nomesCursosSelecionados.includes(m.cursoNome.toLowerCase()))
        )
      );

      const totalVinculos = solicitacoesAtreladas.length + alunosAtrelados.length;

      if (totalVinculos > 0) {
        // MONTA MENSAGEM DE ERRO/ALERTA DETALHADA
        const ehUnico = selecionados.length === 1;
        const nomeEntidade = ehUnico ? selecionados[0].nome : `${selecionados.length} cursos selecionados`;
        const tipoEntidade = ehUnico ? 'O curso' : 'Os';

        let orientacao = 'Remova ou reatribua os vínculos antes de realizar a exclusão:';
        if (solicitacoesAtreladas.length > 0) {
          orientacao += ` ${solicitacoesAtreladas.length} solicitação(ões)`;
        }
        if (alunosAtrelados.length > 0) {
          orientacao += `${solicitacoesAtreladas.length > 0 ? ' e' : ''} ${alunosAtrelados.length} aluno(s) com matrícula ativa.`;
        }

        this.dialog.open(AvisoVinculoDialogComponent, {
          width: '440px',
          data: {
            tipoEntidade,
            entidadeNome: nomeEntidade,
            quantidade: totalVinculos,
            tipoVinculo: 'registro',
            orientacao,
          },
        });
      } else {
        // NENHUM VÍNCULO ENCONTRADO -> ABRE DIALOG DE CONFIRMAÇÃO EM SHARED
        const dialogRef = this.dialog.open(ExclusaoConfirmacaoDialogComponent, {
          width: '400px',
          data: { quantidade: selecionados.length },
        });

        dialogRef.afterClosed().subscribe((confirmado: boolean) => {
          if (confirmado) {
            this.executarExclusao(selecionados);
          }
        });
      }
    });
  }

  private executarExclusao(cursosDeletar: Curso[]): void {
    const ids = cursosDeletar.map((c) => c.id);

    // Requisições paralelas de deleção
    const requisicoes = ids.map((id) => this.cursoService.deletarCurso(id));

    forkJoin(requisicoes).subscribe({
      next: () => {
        this.cursos.update((lista) => lista.filter((item) => !ids.includes(item.id)));
        this.snackBar.open(
          `${ids.length} ${ids.length === 1 ? 'curso excluído' : 'cursos excluídos'} com sucesso!`,
          'OK',
          { duration: 3000 }
        );
        this.cancelarModoSelecao();
        this.atualizarTabela();
      },
      error: () => {
        this.snackBar.open('Erro ao excluir curso(s).', 'Fechar', { duration: 3000 });
      },
    });
  }

  // --- MÉTODOS DE CADASTRO E EDIÇÃO ---

  abrirModalNovoCurso(): void {
    const dialogRef = this.dialog.open(NovoCursoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '640px',
    });

    dialogRef.afterClosed().subscribe((novoCurso: Curso | undefined) => {
      if (novoCurso) {
        this.cursoService.cadastrarCurso(novoCurso).subscribe((cursoCriado: Curso) => {
          this.cursos.update((lista) => [cursoCriado, ...lista]);
          this.atualizarTabela();
          this.snackBar.open('Curso cadastrado com sucesso!', 'OK', { duration: 3000 });
        });
      }
    });
  }

  editarCurso(curso: Curso): void {
    const dialogRef = this.dialog.open(NovoCursoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '640px',
      data: curso,
    });

    dialogRef.afterClosed().subscribe((cursoAtualizado: Curso | undefined) => {
      if (cursoAtualizado) {
        this.cursoService.atualizarCurso(cursoAtualizado).subscribe((res: Curso) => {
          this.cursos.update((lista) =>
            lista.map((item) => (item.id === res.id ? res : item))
          );
          this.atualizarTabela();
          this.snackBar.open('Curso atualizado com sucesso!', 'OK', { duration: 3000 });
        });
      }
    });
  }
}