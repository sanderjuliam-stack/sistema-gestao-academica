import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

import { SolicitacaoDocumento, StatusEmissao, TipoDocumento } from '../../models/solicitacao';
import { SolicitacaoService } from '../../services/solicitacao';
import { ExclusaoConfirmacaoDialogComponent } from '../../shared/components/exclusao-confirmacao-dialog';
import { NovaSolicitacaoDialogComponent } from './nova-solicitacao-dialog';

@Component({
  selector: 'app-solicitacoes',
  providers: [provideNativeDateAdapter()],
  imports: [
    NgClass,
    DatePipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './solicitacoes.html',
  styleUrl: './solicitacoes.scss',
})
export class SolicitacoesComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly solicitacaoService = inject(SolicitacaoService);

  readonly modoSelecao = signal<boolean>(false);
  readonly selection = new SelectionModel<SolicitacaoDocumento>(true, []);

  readonly baseColumns: string[] = [
    'aluno',
    'tipoDocumento',
    'dataSolicitacao',
    'statusEmissao',
    'entregue',
  ];

  readonly displayedColumns = computed(() => {
    return this.modoSelecao() ? ['select', ...this.baseColumns] : this.baseColumns;
  });

  readonly tipoDocumentoMap: Record<TipoDocumento, string> = {
    CERTIFICADO: 'Certificado',
    DECLARACAO_CONCLUSAO: 'Declaração de Conclusão',
    HISTORICO_ESCOLAR: 'Histórico Escolar',
  };

  readonly solicitacoes = signal<SolicitacaoDocumento[]>([]);
  readonly termoBusca = signal<string>('');
  readonly filtroStatusAtivo = signal<StatusEmissao | 'ENTREGUES' | 'TODOS'>('TODOS');
  
  readonly dataInicio = signal<Date | null>(null);
  readonly dataFim = signal<Date | null>(null);

  readonly dataSource = new MatTableDataSource<SolicitacaoDocumento>();

  @ViewChild(MatPaginator) set paginator(p: MatPaginator) {
    if (p) {
      p._intl.itemsPerPageLabel = 'Itens por página:';
      p._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
        if (length === 0 || pageSize === 0) return `0 de ${length}`;
        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
        return `${startIndex + 1} - ${endIndex} de ${length}`;
      };
      this.dataSource.paginator = p;
    }
  }

  @ViewChild(MatSort) set sort(s: MatSort) {
    this.dataSource.sort = s;
  }

  ngOnInit(): void {
    this.carregarSolicitacoes();
  }

  carregarSolicitacoes(): void {
    this.solicitacaoService.getSolicitacoes().subscribe((dados) => {
      this.solicitacoes.set(dados);
      this.atualizarTabela();
    });
  }

  formatarTipoDoc(tipo: TipoDocumento): string {
    return this.tipoDocumentoMap[tipo] || tipo;
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

  abrirDialogDelecao(): void {
    const selecionados = this.selection.selected;
    if (selecionados.length === 0) return;

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

  private executarExclusao(itens: SolicitacaoDocumento[]): void {
    const ids = itens.map((item) => item.id);

    this.solicitacaoService.deletarSolicitacoes(ids).subscribe({
      next: () => {
        this.solicitacoes.update((lista) => lista.filter((item) => !ids.includes(item.id)));
        this.snackBar.open(
          `${ids.length} ${ids.length === 1 ? 'item excluído' : 'itens excluídos'} com sucesso!`,
          'OK',
          { duration: 3000 }
        );
        this.cancelarModoSelecao();
        this.atualizarTabela();
      },
      error: () => {
        this.snackBar.open('Erro ao excluir solicitações.', 'Fechar', { duration: 3000 });
      },
    });
  }

  // --- MÉTODOS DE FILTRO E TABELA ---

  aplicarFiltroTexto(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.termoBusca.set(filterValue);
    this.atualizarTabela();
  }

  filtrarPorStatus(status: StatusEmissao | 'ENTREGUES' | 'TODOS'): void {
    this.filtroStatusAtivo.set(status);
    this.atualizarTabela();
  }

  onDataInicioChange(data: Date | null): void {
    this.dataInicio.set(data);
    this.atualizarTabela();
  }

  onDataFimChange(data: Date | null): void {
    this.dataFim.set(data);
    this.atualizarTabela();
  }

  limparFiltroDatas(): void {
    this.dataInicio.set(null);
    this.dataFim.set(null);
    this.atualizarTabela();
  }

  private atualizarTabela(): void {
    const termo = this.termoBusca().toLowerCase().trim();
    const status = this.filtroStatusAtivo();
    const dtInicio = this.dataInicio();
    const dtFim = this.dataFim();

    const filtrados = this.solicitacoes().filter((item) => {
      let atendeStatus = true;
      if (status === 'ENTREGUES') {
        atendeStatus = item.entregue;
      } else if (status !== 'TODOS') {
        atendeStatus = item.statusEmissao === status;
      }

      const atendeTexto =
        !termo ||
        item.alunoNome.toLowerCase().includes(termo) ||
        item.alunoCpf.includes(termo) ||
        item.cursoNome.toLowerCase().includes(termo);

      let atendeData = true;
      if (item.dataSolicitacao) {
        const dataItem = new Date(`${item.dataSolicitacao}T00:00:00`);

        if (dtInicio) {
          const inicio = new Date(dtInicio);
          inicio.setHours(0, 0, 0, 0);
          if (dataItem < inicio) atendeData = false;
        }

        if (dtFim && atendeData) {
          const fim = new Date(dtFim);
          fim.setHours(23, 59, 59, 999);
          if (dataItem > fim) atendeData = false;
        }
      }

      return atendeStatus && atendeTexto && atendeData;
    });

    this.dataSource.data = filtrados;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  alterarStatus(row: SolicitacaoDocumento, novoStatus: StatusEmissao): void {
    this.solicitacaoService.atualizarStatus(row.id, novoStatus).subscribe(() => {
      this.solicitacoes.update((lista) =>
        lista.map((item) => (item.id === row.id ? { ...item, statusEmissao: novoStatus } : item))
      );
      this.atualizarTabela();
    });
  }

  toggleEntrega(row: SolicitacaoDocumento): void {
    const novaEntrega = !row.entregue;
    const dataEntrega = novaEntrega ? new Date().toISOString().split('T')[0] : undefined;

    this.solicitacaoService.toggleEntrega(row.id, novaEntrega, dataEntrega).subscribe(() => {
      this.solicitacoes.update((lista) =>
        lista.map((item) =>
          item.id === row.id ? { ...item, entregue: novaEntrega, dataEntrega } : item
        )
      );
      this.atualizarTabela();
    });
  }

  abrirModalNovaSolicitacao(): void {
    const dialogRef = this.dialog.open(NovaSolicitacaoDialogComponent, {
      panelClass: 'dialog-no-scroll-x',
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((novasSolicitacoes: Omit<SolicitacaoDocumento, 'id'>[] | undefined) => {
      if (novasSolicitacoes && novasSolicitacoes.length > 0) {
        const requisicoes = novasSolicitacoes.map((s) => this.solicitacaoService.criarSolicitacao(s));
        forkJoin(requisicoes).subscribe((criadas) => {
          this.solicitacoes.update((lista) => [...criadas, ...lista]);
          this.atualizarTabela();
        });
      }
    });
  }
}