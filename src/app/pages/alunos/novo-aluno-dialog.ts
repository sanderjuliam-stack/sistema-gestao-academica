import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

import { Aluno, NotaDisciplina } from '../../models/aluno';
import { Curso } from '../../models/curso';
import { AlunoService } from '../../services/aluno';
import { CursoService } from '../../services/curso';

@Component({
  selector: 'app-novo-aluno-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatStepperModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ alunoEdicao ? 'Editar Aluno' : 'Cadastrar Novo Aluno' }}</h2>

    <mat-dialog-content class="dialog-content">
      <!-- Banner de Erro para CPF Duplicado/Serviço -->
      @if (mensagemErro()) {
        <div class="error-banner" role="alert">
          <mat-icon>error_outline</mat-icon>
          <span>{{ mensagemErro() }}</span>
        </div>
      }

      <mat-stepper linear #stepper>
        <!-- PASSO 1: DADOS PESSOAIS E VÍNCULO ACADÊMICO -->
        <mat-step [completed]="passo1Valido()">
          <ng-template matStepLabel>Dados Pessoais & Curso</ng-template>

          <div class="step-container">
            <div class="section-title">Dados Pessoais</div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome Completo</mat-label>
              <input matInput [(ngModel)]="nome" placeholder="Ex: Ana Clara Silva" required />
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>CPF (apenas números)</mat-label>
                <input 
                  matInput 
                  [(ngModel)]="cpf" 
                  (ngModelChange)="limparErro()" 
                  placeholder="12345678901" 
                  maxlength="11" 
                  required 
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>E-mail (Opcional)</mat-label>
                <input matInput [(ngModel)]="email" type="email" placeholder="aluno@email.com" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="flex-2">
                <mat-label>Cidade Natal</mat-label>
                <input matInput [(ngModel)]="naturalidadeCidade" placeholder="Ex: Belo Horizonte" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>UF</mat-label>
                <input matInput [(ngModel)]="naturalidadeUf" placeholder="MG" maxlength="2" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="flex-2">
                <mat-label>Data Nascimento</mat-label>
                <input matInput [(ngModel)]="dataNascimento" type="date" />
              </mat-form-field>
            </div>

            <div class="section-title">Vínculo Acadêmico & Documentação</div>

            <!-- Campo de Curso com Autocomplete -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Curso</mat-label>
              <input
                type="text"
                matInput
                placeholder="Digite para buscar o curso..."
                [matAutocomplete]="autoCurso"
                [ngModel]="cursoSelecionado()"
                (input)="onBuscaCurso($event)"
                required />
              <mat-autocomplete
                #autoCurso="matAutocomplete"
                [displayWith]="displayCursoFn"
                (optionSelected)="onCursoSelecionado($event.option.value)">
                @for (curso of cursosFiltrados(); track curso.id) {
                  <mat-option [value]="curso">{{ curso.nome }}</mat-option>
                } @empty {
                  <mat-option disabled>Nenhum curso encontrado</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Link da Pasta no Google Drive</mat-label>
              <mat-icon matPrefix>folder_shared</mat-icon>
              <input
                matInput
                [(ngModel)]="linkDocumentos"
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </mat-form-field>

            <div class="stepper-actions-step">
              <button
                mat-flat-button
                color="primary"
                matStepperNext
                [disabled]="!passo1Valido()"
              >
                Próximo: Desempenho
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- PASSO 2: DESEMPENHO ACADÊMICO & TCC -->
        <mat-step>
          <ng-template matStepLabel>Frequência, Notas & TCC</ng-template>

          <div class="step-container">
            <!-- 1. FREQUÊNCIA GERAL -->
            <div class="section-title">Frequência Geral</div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Frequência Geral (%)</mat-label>
                <input
                  matInput
                  type="number"
                  min="0"
                  max="100"
                  [(ngModel)]="frequenciaGeralPct"
                  placeholder="Ex: 85"
                />
                <span matSuffix>%</span>
              </mat-form-field>
            </div>

            <!-- 2. DISCIPLINAS E MÉDIAS -->
            <div class="section-title">Médias Finais das Disciplinas</div>

            @if (notas().length === 0) {
              <p class="empty-msg">Nenhuma disciplina vinculada a este curso.</p>
            } @else {
              <div class="disciplinas-list">
                @for (item of notas(); track item.disciplinaId) {
                  <div class="disciplina-item">
                    <span class="disc-nome">{{ item.disciplinaNome }}</span>
                    <mat-form-field appearance="outline" class="disc-nota-input">
                      <mat-label>Média Final</mat-label>
                      <input
                        matInput
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        [ngModel]="item.notaFinal"
                        (ngModelChange)="atualizarNotaDisciplina(item.disciplinaId, $event)"
                        placeholder="0.0 - 10.0"
                        [attr.aria-label]="'Média final para ' + item.disciplinaNome"
                      />
                    </mat-form-field>
                  </div>
                }
              </div>
            }

            <!-- 3. TRABALHO DE CONCLUSÃO DE CURSO (TCC) -->
            @if (cursoExigeTcc()) {
              <div class="section-title">Trabalho de Conclusão de Curso (TCC)</div>
              
              <div class="tcc-box">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Título do TCC</mat-label>
                  <input matInput [(ngModel)]="tccTitulo" placeholder="Ex: Aplicação de Micro-serviços em Node.js" />
                </mat-form-field>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="flex-2">
                    <mat-label>Tema</mat-label>
                    <input matInput [(ngModel)]="tccTema" placeholder="Ex: Arquitetura de Software" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Tipo de Trabalho</mat-label>
                    <input matInput [(ngModel)]="tccTipoTrabalho" placeholder="Ex: Monografia, Artigo..." />
                  </mat-form-field>
                </div>
              </div>
            }

            <div class="stepper-actions-step">
              <button mat-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon> Voltar
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-footer" align="end">
      <button mat-button class="btn-branco" (click)="cancelar()">Cancelar</button>
      <button
        mat-flat-button class="btn-azul"
        [disabled]="!passo1Valido() || carregando()"
        (click)="salvar()"
      >
        {{ carregando() ? 'Verificando...' : (alunoEdicao ? 'Salvar Alterações' : 'Cadastrar Aluno') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      width: 100%;
      padding: 0 16px;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    mat-stepper {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }
    .step-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 4px 4px 4px;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin: 12px 0 4px 0;
    }
    .error-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background-color: #fde8e8;
      color: #9b1c1c;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      line-height: 1.4;
      border: 1px solid #f8b4b4;
      margin-bottom: 12px;

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
    .tcc-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 12px 0 12px;
      margin-bottom: 8px;
    }
    .form-row {
      display: flex;
      gap: 12px;
      width: 100%;
      background-color: var(--bg-app);
    }
    .flex-1 { flex: 1; min-width: 0; }
    .flex-2 { flex: 2; min-width: 0; }
    .full-width { width: 100%; min-width: 0; }
    .stepper-actions-step {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }
    .disciplinas-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .disciplina-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 12px;
      background: var(--bg-surface);
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }
    .disc-nome {
      font-weight: 500;
      font-size: 0.88rem;
      color: var(--text-secondary);
    }
    .disc-nota-input {
      width: 120px;
      margin-bottom: -1.25em;
    }
    .empty-msg {
      color: var(--text-muted);
      font-style: italic;
      font-size: 0.9rem;
    }
    .dialog-footer {
      .btn-branco {
        color: var(--color-primary);
        &:hover {
          background-color: var(--color-primary-light);
        }
      }
      .btn-azul {
        background-color: var(--color-primary);
        color: var(--text-on-primary);
        &:hover {
          background-color: var(--color-primary-hover);
        }
      }
    }
  `],
})
export class NovoAlunoDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<NovoAlunoDialogComponent>);
  private readonly cursoService = inject(CursoService);
  private readonly alunoService = inject(AlunoService);

  readonly alunoEdicao = inject<Aluno | null>(MAT_DIALOG_DATA, { optional: true });

  readonly cursos = signal<Curso[]>([]);

  private readonly matriculaInicial = this.alunoEdicao?.matriculas?.[0];

  readonly nome = signal(this.alunoEdicao?.nome ?? '');
  readonly cpf = signal(this.alunoEdicao?.cpf ?? '');
  readonly email = signal(this.alunoEdicao?.email ?? '');
  readonly naturalidadeCidade = signal(this.alunoEdicao?.naturalidadeCidade ?? '');
  readonly naturalidadeUf = signal(this.alunoEdicao?.naturalidadeUf ?? '');
  readonly dataNascimento = signal(this.alunoEdicao?.dataNascimento ?? '');

  readonly termoBuscaCurso = signal('');
  readonly cursoSelecionado = signal<Curso | null>(null);
  readonly cursoId = signal<number | null>(this.matriculaInicial?.cursoId ?? null);

  readonly linkDocumentos = signal<string>(this.matriculaInicial?.linkDocumentos ?? '');

  readonly frequenciaGeralPct = signal<number | undefined>(this.matriculaInicial?.frequenciaGeralPct ?? 100);

  readonly tccTitulo = signal<string>(this.matriculaInicial?.tcc?.titulo ?? '');
  readonly tccTema = signal<string>(this.matriculaInicial?.tcc?.tema ?? '');
  readonly tccTipoTrabalho = signal<string>(this.matriculaInicial?.tcc?.tipoTrabalho ?? '');

  readonly notas = signal<NotaDisciplina[]>([]);
  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);

  readonly cursosFiltrados = computed(() => {
    const termo = this.termoBuscaCurso().toLowerCase().trim();
    if (!termo) return this.cursos();
    return this.cursos().filter((c) => c.nome.toLowerCase().includes(termo));
  });

  readonly cursoExigeTcc = computed(() => {
    const id = this.cursoId();
    if (!id) return false;
    const curso = this.cursos().find((c) => c.id === id);
    return curso?.possuiTcc ?? false;
  });

  ngOnInit(): void {
    this.cursoService.getCursos().subscribe((lista) => {
      this.cursos.set(lista);

      const idInicial = this.cursoId();
      if (idInicial) {
        const cursoEncontrado = lista.find((c) => c.id === idInicial);
        if (cursoEncontrado) {
          this.cursoSelecionado.set(cursoEncontrado);
          this.carregarDisciplinasDoCurso(idInicial);
        }
      }
    });
  }

  displayCursoFn(curso: Curso | null): string {
    return curso ? curso.nome : '';
  }

  onBuscaCurso(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.termoBuscaCurso.set(valor);
    this.cursoSelecionado.set(null);
    this.cursoId.set(null);
    this.notas.set([]);
    this.limparErro();
  }

  onCursoSelecionado(curso: Curso): void {
    this.cursoSelecionado.set(curso);
    this.cursoId.set(curso.id);
    this.carregarDisciplinasDoCurso(curso.id);
    this.limparErro();
  }

  limparErro(): void {
    this.mensagemErro.set(null);
  }

  atualizarNotaDisciplina(disciplinaId: number, valor: number | undefined): void {
    this.notas.update((lista) =>
      lista.map((n) => (n.disciplinaId === disciplinaId ? { ...n, notaFinal: valor } : n))
    );
  }

  private carregarDisciplinasDoCurso(idCurso: number): void {
    const curso = this.cursos().find((c) => c.id === idCurso);
    const notasExistentes = this.matriculaInicial?.notasDisciplinas || [];

    if (curso && curso.disciplinas) {
      const listaMapeada = curso.disciplinas.map((d) => {
        const jaExiste = notasExistentes.find((n) => n.disciplinaId === d.id);
        return {
          disciplinaId: d.id,
          disciplinaNome: d.nome,
          notaFinal: jaExiste ? jaExiste.notaFinal : undefined,
        };
      });
      this.notas.set(listaMapeada);
    } else {
      this.notas.set([]);
    }
  }

  passo1Valido(): boolean {
    const partesNome = this.nome().trim().split(/\s+/);
    const nomeValido = partesNome.length >= 2 && partesNome.every((p) => p.length >= 2);

    return (
      nomeValido &&
      this.cpf().trim().length === 11 &&
      this.cursoId() !== null
    );
  }

  salvar(): void {
    if (!this.passo1Valido()) return;

    const cpfFormatado = this.cpf().trim();
    this.carregando.set(true);
    this.limparErro();

    this.alunoService.getAlunos().subscribe({
      next: (alunos) => {
        const cpfExistente = alunos.find(
          (a) => a.cpf === cpfFormatado && a.id !== this.alunoEdicao?.id
        );

        if (cpfExistente) {
          this.mensagemErro.set(
            `Já existe um aluno cadastrado com o CPF ${cpfFormatado} (${cpfExistente.nome}).`
          );
          this.carregando.set(false);
          return;
        }

        const cursoSelecionado = this.cursos().find((c) => c.id === this.cursoId());
        const exigeTcc = this.cursoExigeTcc();

        const tccObjeto = exigeTcc
          ? {
              titulo: this.tccTitulo().trim() || undefined,
              tema: this.tccTema().trim() || undefined,
              tipoTrabalho: this.tccTipoTrabalho().trim() || undefined,
            }
          : undefined;

        const matriculasAtualizadas = this.alunoEdicao?.matriculas?.length
          ? this.alunoEdicao.matriculas.map((m, index) =>
              index === 0
                ? {
                    ...m,
                    cursoId: this.cursoId()!,
                    cursoNome: cursoSelecionado?.nome ?? m.cursoNome,
                    linkDocumentos: this.linkDocumentos().trim() || undefined,
                    frequenciaGeralPct: this.frequenciaGeralPct(),
                    tcc: tccObjeto,
                    notasDisciplinas: this.notas(),
                  }
                : m
            )
          : [
              {
                id: Date.now(),
                alunoId: this.alunoEdicao?.id ?? 0,
                cursoId: this.cursoId()!,
                cursoNome: cursoSelecionado?.nome ?? '',
                dataInicio: new Date().toISOString().split('T')[0],
                linkDocumentos: this.linkDocumentos().trim() || undefined,
                frequenciaGeralPct: this.frequenciaGeralPct(),
                situacao: 'EM_ANDAMENTO' as const,
                tcc: tccObjeto,
                notasDisciplinas: this.notas(),
              },
            ];

        const alunoResultado: Aluno = {
          id: this.alunoEdicao?.id ?? 0,
          nome: this.nome().trim(),
          cpf: cpfFormatado,
          email: this.email().trim() || undefined,
          naturalidadeCidade: this.naturalidadeCidade().trim() || undefined,
          naturalidadeUf: this.naturalidadeUf().trim().toUpperCase() || undefined,
          dataNascimento: this.dataNascimento() || undefined,
          matriculas: matriculasAtualizadas,
        };

        this.carregando.set(false);
        this.dialogRef.close(alunoResultado);
      },
      error: () => {
        this.mensagemErro.set('Erro ao verificar o CPF informado. Tente novamente.');
        this.carregando.set(false);
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}