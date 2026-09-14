import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SolicitacaoDocumento, TipoDocumento } from '../../models/solicitacao';
import { SolicitacaoService } from '../../services/solicitacao';

export interface AlunoOpcao {
  id: number;
  nome: string;
  cpf: string;
}

export interface CursoOpcao {
  id: number;
  nome: string;
}

export type TipoDocumentoSelecao = TipoDocumento | 'AMBOS';

@Component({
  selector: 'app-nova-solicitacao-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Nova Solicitação de Documento</h2>

    <mat-dialog-content class="dialog-content">
      <!-- Alerta de Erro -->
      @if (mensagemErro()) {
        <div class="error-banner" role="alert">
          <mat-icon>error_outline</mat-icon>
          <span>{{ mensagemErro() }}</span>
        </div>
      }

      <!-- Pesquisa de Aluno com Autocomplete -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Aluno</mat-label>
        <input
          type="text"
          matInput
          placeholder="Digite o nome ou CPF..."
          [matAutocomplete]="autoAluno"
          [ngModel]="alunoSelecionado()"
          (input)="onBuscaAluno($event)"
          aria-label="Campo de pesquisa de aluno"
          required />
        <mat-autocomplete
          #autoAluno="matAutocomplete"
          [displayWith]="displayAlunoFn"
          (optionSelected)="alunoSelecionado.set($event.option.value); limparErro()">
          @for (aluno of alunosFiltrados(); track aluno.id) {
            <mat-option [value]="aluno">
              {{ aluno.nome }} (CPF: {{ aluno.cpf }})
            </mat-option>
          } @empty {
            <mat-option disabled>Nenhum aluno encontrado</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <!-- Pesquisa de Curso com Autocomplete -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Curso</mat-label>
        <input
          type="text"
          matInput
          placeholder="Digite o nome do curso..."
          [matAutocomplete]="autoCurso"
          [ngModel]="cursoSelecionado()"
          (input)="onBuscaCurso($event)"
          aria-label="Campo de pesquisa de curso"
          required />
        <mat-autocomplete
          #autoCurso="matAutocomplete"
          [displayWith]="displayCursoFn"
          (optionSelected)="cursoSelecionado.set($event.option.value); limparErro()">
          @for (curso of cursosFiltrados(); track curso.id) {
            <mat-option [value]="curso">
              {{ curso.nome }}
            </mat-option>
          } @empty {
            <mat-option disabled>Nenhum curso encontrado</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      <!-- Tipo de Documento -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tipo de Documento</mat-label>
        <mat-select [(ngModel)]="tipoDocumentoSelecao" (selectionChange)="limparErro()" aria-label="Selecione o tipo de documento" required>
          <mat-option value="CERTIFICADO">Certificado</mat-option>
          <mat-option value="DECLARACAO_CONCLUSAO">Declaração de Conclusão</mat-option>
          <mat-option value="AMBOS">Declaração e Certificado</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Observações -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Observações (Opcional)</mat-label>
        <textarea matInput [(ngModel)]="observacoes" rows="2" aria-label="Observações opcionais"></textarea>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()" aria-label="Cancelar solicitação">Cancelar</button>
      <button 
        mat-flat-button 
        color="primary" 
        [disabled]="!formValido() || carregando()" 
        (click)="salvar()"
        aria-label="Criar solicitação">
        {{ carregando() ? 'Verificando...' : 'Criar Solicitação' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 440px;
      padding-top: 12px !important;
    }
    .full-width {
      width: 100%;
    }
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background-color: var(--bg-pending, #fde8e8);
      color: var(--status-pending, #9b1c1c);
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      line-height: 1.4;
      border: 1px solid var(--status-pending, #f8b4b4);
      margin-bottom: 4px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      span {
        flex: 1;
      }
    }
  `],
})
export class NovaSolicitacaoDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<NovaSolicitacaoDialogComponent>);
  private readonly solicitacaoService = inject(SolicitacaoService);
  private readonly snackBar = inject(MatSnackBar);

  readonly alunosDisponiveis = signal<AlunoOpcao[]>([
    { id: 1, nome: 'Ana Clara Silva', cpf: '12345678901' },
    { id: 2, nome: 'Carlos Eduardo Santos', cpf: '98765432100' },
    { id: 3, nome: 'Mariana Oliveira', cpf: '45678912304' },
  ]);

  readonly cursosDisponiveis = signal<CursoOpcao[]>([
    { id: 101, nome: 'Pós-Graduação em Engenharia de Software' },
    { id: 102, nome: 'MBA em Gestão de Projetos' },
    { id: 103, nome: 'Especialização em Inteligência Artificial' },
  ]);

  readonly termoBuscaAluno = signal('');
  readonly termoBuscaCurso = signal('');

  readonly alunoSelecionado = signal<AlunoOpcao | null>(null);
  readonly cursoSelecionado = signal<CursoOpcao | null>(null);

  readonly tipoDocumentoSelecao = signal<TipoDocumentoSelecao>('CERTIFICADO');
  readonly observacoes = signal('');

  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);

  readonly alunosFiltrados = computed(() => {
    const termo = this.termoBuscaAluno().toLowerCase().trim();
    if (!termo) return this.alunosDisponiveis();
    return this.alunosDisponiveis().filter(
      (a) => a.nome.toLowerCase().includes(termo) || a.cpf.includes(termo)
    );
  });

  readonly cursosFiltrados = computed(() => {
    const termo = this.termoBuscaCurso().toLowerCase().trim();
    if (!termo) return this.cursosDisponiveis();
    return this.cursosDisponiveis().filter((c) => c.nome.toLowerCase().includes(termo));
  });

  displayAlunoFn(aluno: AlunoOpcao | null): string {
    return aluno ? `${aluno.nome} (CPF: ${aluno.cpf})` : '';
  }

  displayCursoFn(curso: CursoOpcao | null): string {
    return curso ? curso.nome : '';
  }

  onBuscaAluno(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.termoBuscaAluno.set(valor);
    this.alunoSelecionado.set(null);
    this.limparErro();
  }

  onBuscaCurso(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.termoBuscaCurso.set(valor);
    this.cursoSelecionado.set(null);
    this.limparErro();
  }

  formValido(): boolean {
    return this.alunoSelecionado() !== null && this.cursoSelecionado() !== null;
  }

  limparErro(): void {
    this.mensagemErro.set(null);
  }

  salvar(): void {
    if (!this.formValido()) return;

    const aluno = this.alunoSelecionado();
    const curso = this.cursoSelecionado();

    if (!aluno || !curso) return;

    this.carregando.set(true);
    this.limparErro();

    this.solicitacaoService.getSolicitacoes().subscribe({
      next: (existentes) => {
        const tiposAValidar: TipoDocumento[] =
          this.tipoDocumentoSelecao() === 'AMBOS'
            ? ['DECLARACAO_CONCLUSAO', 'CERTIFICADO']
            : [this.tipoDocumentoSelecao() as TipoDocumento];

        const duplicadas = existentes.filter(
          (item) =>
            item.alunoCpf === aluno.cpf &&
            item.cursoNome === curso.nome &&
            tiposAValidar.includes(item.tipoDocumento) &&
            !item.entregue
        );

        if (duplicadas.length > 0) {
          const tiposDuplicados = duplicadas
            .map((d) => (d.tipoDocumento === 'CERTIFICADO' ? 'Certificado' : 'Declaração'))
            .join(' e ');

          this.mensagemErro.set(
            `Já existe uma solicitação de ${tiposDuplicados} pendente/em andamento para este aluno neste curso.`
          );
          this.carregando.set(false);
          return;
        }

        const dataHoje = new Date().toISOString().split('T')[0];
        const criarItem = (tipo: TipoDocumento): Omit<SolicitacaoDocumento, 'id'> => ({
          alunoNome: aluno.nome,
          alunoCpf: aluno.cpf,
          cursoNome: curso.nome,
          tipoDocumento: tipo,
          dataSolicitacao: dataHoje,
          statusEmissao: 'PENDENTE',
          entregue: false,
          observacoes: this.observacoes().trim() || undefined,
        });

        const resultado = tiposAValidar.map((tipo) => criarItem(tipo));

        this.snackBar.open('Solicitação criada com sucesso!', 'OK', { duration: 3000 });
        this.dialogRef.close(resultado);
      },
      error: () => {
        this.mensagemErro.set('Erro ao verificar solicitações existentes. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}