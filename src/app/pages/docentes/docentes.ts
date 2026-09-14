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

import { Docente } from '../../models/docente';
import { CursoService } from '../../services/curso';
import { DocenteService } from '../../services/docente';
import { AvisoVinculoDialogComponent } from '../../shared/components/aviso-vinculo-dialog';
import { ExclusaoConfirmacaoDialogComponent } from '../../shared/components/exclusao-confirmacao-dialog';
import { NovoDocenteDialogComponent } from './novo-docente-dialog';

@Component({
  selector: 'app-docentes',
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
  templateUrl: './docentes.html',
  styleUrl: './docentes.scss',
})
export class DocentesComponent implements OnInit {
  private readonly docenteService = inject(DocenteService);
  private readonly cursoService = inject(CursoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly docentes = signal<Docente[]>([]);
  readonly termoBusca = signal<string>('');
  readonly dataSource = new MatTableDataSource<Docente>([]);

  // Modos de Seleção e Checkbox
  readonly modoSelecao = signal<boolean>(false);
  readonly selection = new SelectionModel<Docente>(true, []);

  readonly baseColumns: string[] = ['nome', 'email', 'titulacao', 'acoes'];

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
    this.carregarDocentes();
  }

  carregarDocentes(): void {
    this.docenteService.getDocentes().subscribe((dados) => {
      this.docentes.set(dados);
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

    const filtrados = this.docentes().filter(
      (d) =>
        !termo ||
        d.nome.toLowerCase().includes(termo) ||
        d.email?.toLowerCase().includes(termo) ||
        d.titulacao.toLowerCase().includes(termo)
    );

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

  // --- REGRA DE EXCLUSÃO COM VALIDAÇÃO DE DISCIPLINAS NOS CURSOS ---

  abrirDialogDelecao(): void {
    const selecionados = this.selection.selected;
    if (selecionados.length === 0) return;

    // Consulta os cursos cadastrados para verificar disciplinas vinculadas aos docentes selecionados
    this.cursoService
      .getCursos()
      .pipe(catchError(() => of([])))
      .subscribe((cursos) => {
        const idsDocentes = selecionados.map((d) => d.id);
        const nomesDocentes = selecionados.map((d) => d.nome.toLowerCase());

        let disciplinasVinculadasCount = 0;

        // Varre os cursos e suas disciplinas buscando vínculos por docenteId ou docenteNome
        cursos.forEach((curso) => {
          curso.disciplinas?.forEach((disciplina) => {
            const porId = disciplina.docenteId && idsDocentes.includes(disciplina.docenteId);
            const porNome = disciplina.docenteNome && nomesDocentes.includes(disciplina.docenteNome.toLowerCase());

            if (porId || porNome) {
              disciplinasVinculadasCount++;
            }
          });
        });

        if (disciplinasVinculadasCount > 0) {
          // IMPEDIMENTO: ABRE MODAL DE AVISO
          const ehUnico = selecionados.length === 1;
          const nomeEntidade = ehUnico ? selecionados[0].nome : `${selecionados.length} docentes selecionados`;
          const tipoEntidade = ehUnico ? 'O docente' : 'Os';

          this.dialog.open(AvisoVinculoDialogComponent, {
            width: '440px',
            data: {
              tipoEntidade,
              entidadeNome: nomeEntidade,
              quantidade: disciplinasVinculadasCount,
              tipoVinculo: 'disciplina(s) em curso(s) cadastrado(s)',
              orientacao:
                'Remova ou reatribua o docente nas disciplinas dos cursos correspondentes antes de realizar a exclusão.',
            },
          });
        } else {
          // SEM VÍNCULOS: ABRE CONFIRMAÇÃO DE EXCLUSÃO
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

  private executarExclusao(docentesDeletar: Docente[]): void {
    const ids = docentesDeletar.map((d) => d.id);

    const requisicoes = ids.map((id) => this.docenteService.deletarDocente(id));

    forkJoin(requisicoes).subscribe({
      next: () => {
        this.docentes.update((lista) => lista.filter((item) => !ids.includes(item.id)));
        this.snackBar.open(
          `${ids.length} ${ids.length === 1 ? 'docente excluído' : 'docentes excluídos'} com sucesso!`,
          'OK',
          { duration: 3000 }
        );
        this.cancelarModoSelecao();
        this.atualizarTabela();
      },
      error: () => {
        this.snackBar.open('Erro ao excluir docente(s).', 'Fechar', { duration: 3000 });
      },
    });
  }

  // --- MÉTODOS DE CADASTRO E EDIÇÃO ---

  abrirModalNovoDocente(): void {
    const dialogRef = this.dialog.open(NovoDocenteDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '540px',
    });

    dialogRef.afterClosed().subscribe((novoDocente: Docente | undefined) => {
      if (novoDocente) {
        this.docenteService.cadastrarDocente(novoDocente).subscribe((docenteCriado: Docente) => {
          this.docentes.update((lista) => [docenteCriado, ...lista]);
          this.atualizarTabela();
          this.snackBar.open('Docente cadastrado com sucesso!', 'OK', { duration: 3000 });
        });
      }
    });
  }

  editarDocente(docente: Docente): void {
    const dialogRef = this.dialog.open(NovoDocenteDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '540px',
      data: docente,
    });

    dialogRef.afterClosed().subscribe((docenteAtualizado: Docente | undefined) => {
      if (docenteAtualizado) {
        this.docenteService.atualizarDocente(docenteAtualizado).subscribe((res: Docente) => {
          this.docentes.update((lista) =>
            lista.map((item) => (item.id === res.id ? res : item))
          );
          this.atualizarTabela();
          this.snackBar.open('Docente atualizado com sucesso!', 'OK', { duration: 3000 });
        });
      }
    });
  }
}