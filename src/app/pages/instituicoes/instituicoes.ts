import { SelectionModel } from '@angular/cdk/collections';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of } from 'rxjs'; // <-- forkJoin adicionado aqui

import { Instituicao } from '../../models/curso';
import { CursoService } from '../../services/curso';
import { InstituicaoService } from '../../services/instituicao';
import { AvisoVinculoDialogComponent } from '../../shared/components/aviso-vinculo-dialog';
import { ExclusaoConfirmacaoDialogComponent } from '../../shared/components/exclusao-confirmacao-dialog';
import { InstituicaoDialogComponent } from './instituicao-dialog'; // Modal de cadastro/edição
import { AlunoService } from '../../services/aluno';
import { SolicitacaoService } from '../../services/solicitacao';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-instituicoes',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatTableModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule, 
    MatChipsModule
  ],
  templateUrl: './instituicoes.html',
  styleUrl: './instituicoes.scss',
})
export class InstituicoesComponent implements OnInit {
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly cursoService = inject(CursoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly instituicoes = signal<Instituicao[]>([]);
  readonly termoBusca = signal<string>('');
  readonly dataSource = new MatTableDataSource<Instituicao>([]);

  readonly modoSelecao = signal<boolean>(false);
  readonly selection = new SelectionModel<Instituicao>(true, []);

  private readonly alunoService = inject(AlunoService);
  private readonly solicitacaoService = inject(SolicitacaoService);

  readonly baseColumns: string[] = ['nome', 'cnpj', 'telefone', 'totalMatriculas', 'solicitacoesPendentes', 'acoes'];

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
    this.carregarInstituicoes();
  }

  carregarInstituicoes(): void {
    forkJoin({
      instituicoes: this.instituicaoService.getInstituicoes(),
      cursos: this.cursoService.getCursos().pipe(catchError(() => of([]))),
      alunos: this.alunoService.getAlunos().pipe(catchError(() => of([]))),
      solicitacoes: this.solicitacaoService.getSolicitacoes().pipe(catchError(() => of([]))),
    }).subscribe(({ instituicoes, cursos, alunos, solicitacoes }) => {
      
      const instituicoesMapeadas = instituicoes.map((inst) => {
        // 1. Identifica IDs e nomes dos cursos pertencentes a esta instituição
        const cursosDaInst = cursos.filter((c) => c.instituicao && c.instituicao.id === inst.id);
        const idsCursos = cursosDaInst.map((c) => c.id);
        const nomesCursos = cursosDaInst.map((c) => c.nome.toLowerCase());

        // 2. Conta total de matrículas atreladas aos cursos desta instituição
        const totalMatriculas = alunos.reduce((acc, aluno) => {
          const matriculasDoAluno = aluno.matriculas?.filter(
            (m) => (m.cursoId && idsCursos.includes(m.cursoId)) || 
                   (m.cursoNome && nomesCursos.includes(m.cursoNome.toLowerCase()))
          ).length || 0;
          return acc + matriculasDoAluno;
        }, 0);

        // 3. Conta solicitações pendentes atreladas aos cursos desta instituição
        const solicitacoesPendentes = solicitacoes.filter((s) => {
          const ehPendente = s.statusEmissao?.toLowerCase() === 'pendente' || s.statusEmissao?.toLowerCase() === 'em_analise';
          const pertenceInstituicao = s.cursoNome && nomesCursos.includes(s.cursoNome.toLowerCase());
          return ehPendente && pertenceInstituicao;
        }).length;

        return {
          ...inst,
          totalMatriculas,
          solicitacoesPendentes,
        };
      });

      this.instituicoes.set(instituicoesMapeadas);
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

    const filtrados = this.instituicoes().filter(
      (i) =>
        !termo ||
        i.nome.toLowerCase().includes(termo) ||
        i.cnpj?.toLowerCase().includes(termo)
    );

    this.dataSource.data = filtrados;
  }

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

  abrirDialogDelecao(): void {
    const selecionados = this.selection.selected;
    if (selecionados.length === 0) return;

    // Verifica se existem cursos vinculados a alguma das instituições selecionadas
    this.cursoService.getCursos().pipe(catchError(() => of([]))).subscribe((cursos) => {
      const idsInstituicoesSelecionadas = selecionados.map((i) => i.id!);
      
      const cursosAtrelados = cursos.filter(
        (c) => c.instituicao && c.instituicao.id && idsInstituicoesSelecionadas.includes(c.instituicao.id)
      );

      if (cursosAtrelados.length > 0) {
        const ehUnico = selecionados.length === 1;
        const nomeEntidade = ehUnico ? selecionados[0].nome : `${selecionados.length} instituições selecionadas`;

        this.dialog.open(AvisoVinculoDialogComponent, {
          width: '440px',
          data: {
            tipoEntidade: ehUnico ? 'A instituição' : 'As',
            entidadeNome: nomeEntidade,
            quantidade: cursosAtrelados.length,
            tipoVinculo: 'curso(s) vinculado(s)',
            orientacao: 'Remova ou reatribua os cursos vinculados antes de realizar a exclusão.',
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

  private executarExclusao(instituicoesDeletar: Instituicao[]): void {
    const ids = instituicoesDeletar.map((i) => i.id!).filter((id) => id !== undefined);

    ids.forEach((id, index) => {
      this.instituicaoService.deletarInstituicao(id).subscribe({
        next: () => {
          if (index === ids.length - 1) {
            this.instituicoes.update((lista) => lista.filter((item) => !ids.includes(item.id!)));
            this.snackBar.open(`${ids.length} instituição(ões) excluída(s) com sucesso!`, 'OK', { duration: 3000 });
            this.cancelarModoSelecao();
            this.atualizarTabela();
          }
        },
        error: () => {
          this.snackBar.open('Erro ao excluir instituição(ões).', 'Fechar', { duration: 3000 });
        },
      });
    });
  }

  abrirModalNovaInstituicao(): void {
    const dialogRef = this.dialog.open(InstituicaoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '600px',
    });

    dialogRef.afterClosed().subscribe((novaInst: Instituicao | undefined) => {
      if (novaInst) {
        this.instituicaoService.cadastrarInstituicao(novaInst).subscribe((criada: Instituicao) => {
          this.instituicoes.update((lista) => [criada, ...lista]);
          this.atualizarTabela();
          this.snackBar.open('Instituição cadastrada com sucesso!', 'OK', { duration: 3000 });
        });
      }
    });
  }

  editarInstituicao(instituicao: Instituicao): void {
    const dialogRef = this.dialog.open(InstituicaoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '600px',
      data: instituicao,
    });

    dialogRef.afterClosed().subscribe((atualizada: Instituicao | undefined) => {
      if (atualizada) {
        this.instituicaoService.atualizarInstituicao(atualizada).subscribe((res: Instituicao) => {
          this.instituicoes.update((lista) =>
            lista.map((item) => (item.id === res.id ? res : item))
          );
          this.atualizarTabela();
          this.snackBar.open('Instituição atualizada com sucesso!', 'OK', { duration: 3000 });
        });
      }
    });
  }
}