import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Curso } from '../../models/curso';
import { Disciplina } from '../../models/disciplina';
import { Docente } from '../../models/docente';
import { DocenteService } from '../../services/docente';

@Component({
  selector: 'app-novo-curso-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
  <h2 mat-dialog-title>{{ cursoEdicao ? 'Editar Curso' : 'Novo Curso' }}</h2>
  <!-- Conteúdo interno rolável -->
  <mat-dialog-content class="dialog-content">
    <mat-stepper #stepper linear>
      <!-- ETAPA 1: Dados Gerais -->
      <mat-step [stepControl]="dadosGeraisForm">
        <form [formGroup]="dadosGeraisForm" class="step-form">
          <ng-template matStepLabel>Dados Gerais</ng-template>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome do Curso</mat-label>
            <input matInput formControlName="nome" placeholder="Ex: Engenharia de Software" aria-label="Nome do curso" />
            @if (dadosGeraisForm.get('nome')?.hasError('required')) {
              <mat-error>Campo obrigatório</mat-error>
            }
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Instituição</mat-label>
              <input matInput formControlName="instituicao" placeholder="Ex: Campus Central" aria-label="Instituição" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Área do Conhecimento</mat-label>
              <input matInput formControlName="areaConhecimento" placeholder="Ex: Tecnologia, Saúde, Educação" aria-label="Área do conhecimento" />
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Nível</mat-label>
              <mat-select formControlName="nivel" aria-label="Nível do curso">
                <mat-option value="GRADUACAO">Graduação</mat-option>
                <mat-option value="POS_GRADUACAO">Pós-Graduação</mat-option>
                <mat-option value="EXTENSAO">Extensão</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Carga Horária Total (h)</mat-label>
              <input matInput type="number" formControlName="cargaHorariaTotal" placeholder="360" aria-label="Carga horária total em horas" />
              @if (dadosGeraisForm.get('cargaHorariaTotal')?.hasError('required')) {
                <mat-error>Campo obrigatório</mat-error>
              }
            </mat-form-field>
          </div>
        </form>
      </mat-step>

      <!-- ETAPA 2: Disciplinas e TCC -->
      <mat-step [stepControl]="disciplinasForm">
        <form [formGroup]="disciplinasForm" class="step-form">
          <ng-template matStepLabel>Disciplinas e TCC</ng-template>

          <div class="tcc-toggle-box">
            <mat-slide-toggle formControlName="possuiTcc" color="primary">
              Este curso exige Trabalho de Conclusão de Curso (TCC)?
            </mat-slide-toggle>
          </div>

          <div class="disciplinas-header">
            <p class="section-subtitle">Monte a grade curricular vinculando docentes e carga horária.</p>
            <button mat-stroked-button color="primary" type="button" (click)="adicionarDisciplinaForm()" aria-label="Adicionar disciplina">
              <mat-icon>add</mat-icon>
              Adicionar Disciplina
            </button>
          </div>

          <div formArrayName="disciplinas" class="disciplinas-container">
            @for (discControl of disciplinasControls; track $index) {
              <div [formGroupName]="$index" class="disciplina-card mat-elevation-z1">
                <div class="disc-row">
                  <mat-form-field appearance="outline" class="ordem-field">
                    <mat-label>Ordem</mat-label>
                    <input matInput type="number" formControlName="ordem" readonly aria-label="Ordem da disciplina" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="flex-2">
                    <mat-label>Título da Disciplina</mat-label>
                    <input matInput formControlName="nome" placeholder="Ex: Arquitetura de Software" aria-label="Título da disciplina" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>H/A (Aulas)</mat-label>
                    <input matInput type="number" formControlName="cargaHoraria" placeholder="60" aria-label="Carga horária da disciplina" />
                  </mat-form-field>

                  <button
                    mat-icon-button
                    color="warn"
                    type="button"
                    matTooltip="Remover disciplina"
                    [attr.aria-label]="'Remover disciplina ' + (discControl.get('nome')?.value || ($index + 1))"
                    (click)="removerDisciplina($index)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>

                <div class="disc-row">
                  <!-- Campo de Docente com Autocomplete por Digitação -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Docente Responsável</mat-label>
                    <input
                      type="text"
                      matInput
                      formControlName="docente"
                      placeholder="Digite para buscar o docente..."
                      [matAutocomplete]="autoDocente"
                      aria-label="Docente responsável pela disciplina" />
                    <mat-autocomplete #autoDocente="matAutocomplete" [displayWith]="displayDocenteFn">
                      @for (docente of getDocentesFiltrados(discControl.get('docente')?.value); track docente.id) {
                        <mat-option [value]="docente">
                          {{ docente.nome }} ({{ docente.titulacao }})
                        </mat-option>
                      } @empty {
                        <mat-option disabled>Nenhum docente encontrado</mat-option>
                      }
                    </mat-autocomplete>
                  </mat-form-field>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <mat-icon class="empty-icon">menu_book</mat-icon>
                <p>Nenhuma disciplina adicionada ainda.</p>
                <button mat-flat-button color="primary" type="button" (click)="adicionarDisciplinaForm()" aria-label="Adicionar primeira disciplina">
                  <mat-icon>add</mat-icon>
                  Adicionar Primeira Disciplina
                </button>
              </div>
            }
          </div>
        </form>
      </mat-step>
    </mat-stepper>
  </mat-dialog-content>

  <!-- RODAPÉ FIXO -->
  <mat-dialog-actions align="end" class="dialog-actions">
    <!-- LADO ESQUERDO: Cancelar / Voltar -->
    @if (stepper.selectedIndex === 0) {
      <button mat-button type="button" (click)="cancelar()" aria-label="Cancelar cadastro">Cancelar</button>
    } @else {
      <button mat-button type="button" (click)="stepper.previous()" aria-label="Voltar para etapa anterior">
        <mat-icon>arrow_back</mat-icon>
        Voltar
      </button>
    }

    <!-- LADO DIREITO: Avançar / Salvar -->
    @if (stepper.selectedIndex === 0) {
      <button 
        mat-flat-button 
        color="primary" 
        type="button" 
        (click)="stepper.next()" 
        [disabled]="dadosGeraisForm.invalid"
        aria-label="Avançar para etapa de disciplinas">
        Avançar
        <mat-icon>arrow_forward</mat-icon>
      </button>
    } @else {
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="dadosGeraisForm.invalid || disciplinasForm.invalid"
        (click)="salvar()"
        aria-label="Salvar curso">
        {{ cursoEdicao ? 'Salvar Alterações' : 'Finalizar Cadastro' }}
      </button>
    }
  </mat-dialog-actions>
  `,
  styles: [`
  /* Garante altura e rolagem do conteúdo */
  .dialog-content {
    width: 100%;
    max-height: 60vh;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    padding: 0 16px 16px 16px;
  }

  /* Estilo do Rodapé Fixo */
  .dialog-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px !important;
    margin: 0 !important;
    border-top: 1px solid var(--border-color, #e2e8f0);
    background-color: var(--bg-surface, #ffffff);
  }

  .step-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 16px;
  }

  .form-row {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .disc-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .flex-1 { flex: 1; min-width: 0; }
  .flex-2 { flex: 2; min-width: 0; }
  .full-width { width: 100%; min-width: 0; }
  .ordem-field { width: 80px; }

  .tcc-toggle-box {
    background: var(--bg-repo);
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .disciplinas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .section-subtitle {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .disciplinas-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-right: 4px;
  }

  .disciplina-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 12px 12px 0 12px;
  }

  .empty-state {
    text-align: center;
    padding: 24px 16px;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
  }

  .empty-icon {
    font-size: 40px;
    width: 40px;
    height: 40px;
    margin-bottom: 4px;
    color: var(--text-secondary);
  }
  `],
})
export class NovoCursoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<NovoCursoDialogComponent>);
  private readonly docenteService = inject(DocenteService);

  readonly cursoEdicao = inject<Curso | null>(MAT_DIALOG_DATA, { optional: true });
  readonly docentes = signal<Docente[]>([]);

  // Etapa 1 Form Group
  readonly dadosGeraisForm: FormGroup = this.fb.group({
    nome: [this.cursoEdicao?.nome ?? '', Validators.required],
    instituicao: [this.cursoEdicao?.instituicao ?? ''],
    areaConhecimento: [this.cursoEdicao?.areaConhecimento ?? ''],
    nivel: [this.cursoEdicao?.nivel ?? 'POS_GRADUACAO', Validators.required],
    cargaHorariaTotal: [this.cursoEdicao?.cargaHorariaTotal ?? null, [Validators.required, Validators.min(1)]],
  });

  readonly disciplinasForm: FormGroup = this.fb.group({
    possuiTcc: [this.cursoEdicao?.possuiTcc ?? true],
    disciplinas: this.fb.array([]),
  });

  get disciplinasArray(): FormArray {
    return this.disciplinasForm.get('disciplinas') as FormArray;
  }

  get disciplinasControls() {
    return this.disciplinasArray.controls as FormGroup[];
  }

  ngOnInit(): void {
    if (this.cursoEdicao?.disciplinas?.length) {
      this.cursoEdicao.disciplinas.forEach((disc, index) => {
        this.disciplinasArray.push(
          this.criarDisciplinaGroup(disc.nome, disc.cargaHoraria, disc.docenteId, index + 1, disc.id)
        );
      });
    }

    this.docenteService.getDocentes().subscribe((lista) => {
      this.docentes.set(lista);
      this.sincronizarDocentesForm();
    });
  }

  displayDocenteFn(docente: Docente | null): string {
    return docente ? `${docente.nome} (${docente.titulacao})` : '';
  }

  getDocentesFiltrados(value: string | Docente | null): Docente[] {
    if (!value) {
      return this.docentes();
    }
    const termo = typeof value === 'string' ? value.toLowerCase().trim() : '';
    if (!termo) {
      return this.docentes();
    }
    return this.docentes().filter(
      (d) =>
        d.nome.toLowerCase().includes(termo) ||
        d.titulacao?.toLowerCase().includes(termo)
    );
  }

  criarDisciplinaGroup(
    nome = '',
    cargaHoraria: number | null = null,
    docenteId: number | null = null,
    ordem = 1,
    id: number | null = null
  ): FormGroup {
    const docenteEncontrado = this.docentes().find((d) => d.id === docenteId) ?? null;

    return this.fb.group({
      id: [id],
      nome: [nome, Validators.required],
      cargaHoraria: [cargaHoraria, [Validators.required, Validators.min(1)]],
      docente: [docenteEncontrado],
      ordem: [ordem],
    });
  }

  private sincronizarDocentesForm(): void {
    if (!this.cursoEdicao?.disciplinas?.length) return;

    this.disciplinasControls.forEach((control, index) => {
      const discEdicao = this.cursoEdicao?.disciplinas?.[index];
      if (discEdicao?.docenteId) {
        const docenteObj = this.docentes().find((d) => d.id === discEdicao.docenteId) ?? null;
        control.patchValue({ docente: docenteObj });
      }
    });
  }

  adicionarDisciplinaForm(): void {
    const proximaOrdem = this.disciplinasArray.length + 1;
    this.disciplinasArray.push(this.criarDisciplinaGroup('', null, null, proximaOrdem));
  }

  removerDisciplina(index: number): void {
    this.disciplinasArray.removeAt(index);
    this.disciplinasControls.forEach((control, i) => {
      control.patchValue({ ordem: i + 1 });
    });
  }

  salvar(): void {
    if (this.dadosGeraisForm.invalid || this.disciplinasForm.invalid) return;

    const dadosGerais = this.dadosGeraisForm.value;
    const disciplinasFormVal = this.disciplinasForm.value;

    const disciplinasMapeadas: Disciplina[] = disciplinasFormVal.disciplinas.map((disc: any) => {
      const docenteObj = typeof disc.docente === 'object' ? disc.docente : null;

      return {
        id: disc.id ?? (Date.now() + Math.random()),
        nome: disc.nome.trim(),
        cargaHoraria: Number(disc.cargaHoraria),
        docenteId: docenteObj?.id ?? undefined,
        docenteNome: docenteObj ? docenteObj.nome : undefined,
      };
    });

    const cursoResultado: Curso = {
      id: this.cursoEdicao?.id ?? 0,
      nome: dadosGerais.nome.trim(),
      instituicao: dadosGerais.instituicao?.trim() || undefined,
      areaConhecimento: dadosGerais.areaConhecimento?.trim() || undefined,
      nivel: dadosGerais.nivel,
      cargaHorariaTotal: Number(dadosGerais.cargaHorariaTotal),
      possuiTcc: Boolean(disciplinasFormVal.possuiTcc),
      disciplinas: disciplinasMapeadas,
    };

    this.dialogRef.close(cursoResultado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}