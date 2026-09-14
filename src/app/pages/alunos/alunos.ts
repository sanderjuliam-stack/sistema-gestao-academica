import { SelectionModel } from '@angular/cdk/collections';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { catchError, of } from 'rxjs';

import { Aluno } from '../../models/aluno';
import { AlunoService } from '../../services/aluno';
import { SolicitacaoService } from '../../services/solicitacao';
import { AvisoVinculoDialogComponent } from '../../shared/components/aviso-vinculo-dialog';
import { ExclusaoConfirmacaoDialogComponent } from '../../shared/components/exclusao-confirmacao-dialog';
import { RepositorioDocumentosDialogComponent } from '../../shared/components/repositorio-documentos-dialog';
import { DesempenhoAcademicoDialogComponent } from './desempenho-academico-dialog';
import { NovoAlunoDialogComponent } from './novo-aluno-dialog';

@Component({
  selector: 'app-alunos',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './alunos.html',
  styleUrl: './alunos.scss',
})
export class AlunosComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly alunoService = inject(AlunoService);
  private readonly solicitacaoService = inject(SolicitacaoService);

  readonly modoSelecao = signal<boolean>(false);
  readonly selection = new SelectionModel<Aluno>(true, []);

  readonly baseColumns: string[] = ['nome', 'cpf', 'email', 'cursoPrincipal', 'acoes'];

  readonly displayedColumns = computed(() => {
    return this.modoSelecao() ? ['select', ...this.baseColumns] : this.baseColumns;
  });

  readonly alunos = signal<Aluno[]>([]);
  readonly termoBusca = signal('');
  readonly dataSource = new MatTableDataSource<Aluno>();

  @ViewChild(MatPaginator) set paginator(p: MatPaginator) {
    this.dataSource.paginator = p;
  }

  @ViewChild(MatSort) set sort(s: MatSort) {
    this.dataSource.sort = s;
  }

  ngOnInit(): void {
    this.carregarAlunos();
  }

  carregarAlunos(): void {
    this.alunoService.getAlunos().subscribe((dados) => {
      this.alunos.set(dados);
      this.atualizarTabela();
    });
  }

  aplicarFiltroTexto(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.termoBusca.set(valor);
    this.atualizarTabela();
  }

  private atualizarTabela(): void {
    const termo = this.termoBusca().toLowerCase().trim();

    const filtrados = this.alunos().filter((aluno) => {
      return (
        !termo ||
        aluno.nome.toLowerCase().includes(termo) ||
        aluno.cpf.includes(termo) ||
        aluno.email?.toLowerCase().includes(termo) ||
        aluno.matriculas?.some((m) => m.cursoNome.toLowerCase().includes(termo))
      );
    });

    this.dataSource.data = filtrados;
  }

  // --- LÓGICA DE SELEÇÃO MÚLTIPLA ---

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

  // --- EXCLUSÃO COM VALIDAÇÃO DE VÍNCULO EN SOLICITAÇÕES ---

  abrirDialogDelecao(): void {
    const selecionados = this.selection.selected;
    if (selecionados.length === 0) return;

    this.solicitacaoService
      .getSolicitacoes()
      .pipe(catchError(() => of([])))
      .subscribe((solicitacoes) => {
        const cpfsSelecionados = selecionados.map((a) => a.cpf);

        const solicitacoesAtreladas = solicitacoes.filter((s) =>
          cpfsSelecionados.includes(s.alunoCpf)
        );

        if (solicitacoesAtreladas.length > 0) {
          const ehUnico = selecionados.length === 1;
          const nomeEntidade = ehUnico
            ? selecionados[0].nome
            : `${selecionados.length} alunos selecionados`;
          const tipoEntidade = ehUnico ? 'O aluno' : 'Os';

          this.dialog.open(AvisoVinculoDialogComponent, {
            width: '440px',
            data: {
              tipoEntidade,
              entidadeNome: nomeEntidade,
              quantidade: solicitacoesAtreladas.length,
              tipoVinculo: 'solicitação(ões) de documento',
              orientacao:
                'Remova ou finalize as solicitações de documentos atreladas a este(s) aluno(s) antes de realizar a exclusão.',
            },
          });
        } else {
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

  private executarExclusao(alunosDeletar: Aluno[]): void {
    const ids = alunosDeletar.map((a) => a.id);

    this.alunoService.deletarAlunos(ids).subscribe({
      next: () => {
        this.alunos.update((lista) => lista.filter((item) => !ids.includes(item.id)));
        this.snackBar.open(
          `${ids.length} ${ids.length === 1 ? 'aluno excluído' : 'alunos excluídos'} com sucesso!`,
          'OK',
          { duration: 3000 }
        );
        this.cancelarModoSelecao();
        this.atualizarTabela();
      },
      error: () => {
        this.snackBar.open('Erro ao excluir aluno(s).', 'Fechar', { duration: 3000 });
      },
    });
  }

  // --- DEMAIS MÉTODOS DE MODAL ---

  abrirModalNovoAluno(): void {
    const dialogRef = this.dialog.open(NovoAlunoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((resultado: Omit<Aluno, 'id'> | undefined) => {
      if (resultado) {
        this.alunoService.cadastrarAluno(resultado).subscribe((novoAluno) => {
          this.alunos.update((lista) => [novoAluno, ...lista]);
          this.atualizarTabela();
        });
      }
    });
  }

  editarAluno(aluno: Aluno): void {
    const dialogRef = this.dialog.open(NovoAlunoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '600px',
      data: aluno,
    });

    dialogRef.afterClosed().subscribe((alunoAtualizado: Aluno | undefined) => {
      if (alunoAtualizado) {
        this.alunoService.atualizarAluno(alunoAtualizado).subscribe((res: Aluno) => {
          this.alunos.update((lista) =>
            lista.map((item) => (item.id === res.id ? res : item))
          );
          this.atualizarTabela();
        });
      }
    });
  }

  abrirDesempenhoAcademico(aluno: Aluno): void {
    const dialogRef = this.dialog.open(DesempenhoAcademicoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '600px',
      data: aluno,
    });

    dialogRef.afterClosed().subscribe((alunoAtualizado: Aluno | undefined) => {
      if (alunoAtualizado) {
        this.alunoService.atualizarAluno(alunoAtualizado).subscribe((res: Aluno) => {
          this.alunos.update((lista) =>
            lista.map((item) => (item.id === res.id ? res : item))
          );
          this.atualizarTabela();
        });
      }
    });
  }

  abrirRepositorio(aluno: Aluno): void {
    const matricula = aluno.matriculas?.[0];
    if (!matricula) {
      return;
    }

    const dialogRef = this.dialog.open(RepositorioDocumentosDialogComponent, {
      width: '560px',
      data: { aluno, matricula },
    });

    dialogRef.afterClosed().subscribe((alunoAtualizado: Aluno | undefined) => {
      if (alunoAtualizado) {
        this.alunos.update((lista) =>
          lista.map((item) => (item.id === alunoAtualizado.id ? alunoAtualizado : item))
        );
        this.atualizarTabela();
      }
    });
  }
}