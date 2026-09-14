import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { Aluno, Matricula, NotaDisciplina } from '../../models/aluno';
import { Curso } from '../../models/curso';
import { CursoService } from '../../services/curso';

@Component({
  selector: 'app-desempenho-academico-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      Desempenho Acadêmico - {{ aluno.nome }}
    </h2>

    <mat-dialog-content class="dialog-content">
      @if (matricula) {
        <p class="subtitle-curso">
          <mat-icon>school</mat-icon> {{ matricula.cursoNome }}
        </p>

        <mat-tab-group headerPosition="above">
          <!-- ABA 1: Frequência Geral & TCC -->
          <mat-tab label="Geral & TCC">
            <div class="tab-body">
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
                  <span class="porcentagem" matSuffix>%</span>
                </mat-form-field>
              </div>

              <!-- BLOCO CONDICIONAL DO TCC -->
              @if (cursoExigeTcc()) {
                <div class="section-title">Trabalho de Conclusão de Curso (TCC)</div>

                <div class="tcc-box">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Título do TCC</mat-label>
                    <input
                      matInput
                      [(ngModel)]="tccTitulo"
                      placeholder="Ex: Aplicação de Micro-serviços em Node.js"
                    />
                  </mat-form-field>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="flex-2">
                      <mat-label>Tema</mat-label>
                      <input
                        matInput
                        [(ngModel)]="tccTema"
                        placeholder="Ex: Arquitetura de Software"
                      />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="flex-1">
                      <mat-label>Tipo de Trabalho</mat-label>
                      <input
                        matInput
                        [(ngModel)]="tccTipoTrabalho"
                        placeholder="Ex: Monografia, Artigo..."
                      />
                    </mat-form-field>
                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ABA 2: Média Final por Disciplina -->
          <mat-tab label="Notas das Disciplinas">
            <div class="tab-body">
              @if (notas().length === 0) {
                <p class="empty-msg">Nenhuma disciplina vinculada ao curso.</p>
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
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <p>Este aluno não possui matrículas ativas.</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-footer" align="end">
      <button mat-button class="btn-branco" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button class="btn-azul" [disabled]="!matricula" (click)="salvar()">
        Salvar Notas & Frequência
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 580px;
      padding-top: 8px !important;
    }
    .subtitle-curso {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-primary);
      font-weight: 600;
      margin-bottom: 12px;
    }
    .tab-body {
      padding: 16px 4px 8px 4px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      margin: 4px 0;
    }
    .tcc-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 12px 0 12px;
    }
    .form-row {
      display: flex;
      gap: 12px;
      background-color: var(--bg-app);
    }
    .full-width { width: 100%; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .disciplinas-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 280px;
      overflow-y: auto;
    }
    .disciplina-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 12px;
      background: var(--bg-surface);
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }
    .disc-nome {
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .disc-nota-input {
      width: 120px;
      margin-bottom: -1.25em;
    }
    .empty-msg {
      color: var(--text-muted);
      font-style: italic;
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
    .porcentagem {
      padding: 5px;
    }
  `],
})
export class DesempenhoAcademicoDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<DesempenhoAcademicoDialogComponent>);
  private readonly cursoService = inject(CursoService);

  readonly aluno = inject<Aluno>(MAT_DIALOG_DATA);
  readonly matricula: Matricula | undefined = this.aluno.matriculas?.[0];

  readonly frequenciaGeralPct = signal<number | undefined>(this.matricula?.frequenciaGeralPct);

  readonly tccTitulo = signal<string>(this.matricula?.tcc?.titulo ?? '');
  readonly tccTema = signal<string>(this.matricula?.tcc?.tema ?? '');
  readonly tccTipoTrabalho = signal<string>(this.matricula?.tcc?.tipoTrabalho ?? '');

  readonly notas = signal<NotaDisciplina[]>([]);
  readonly cursoSelecionado = signal<Curso | null>(null);

  readonly cursoExigeTcc = computed(() => this.cursoSelecionado()?.possuiTcc ?? false);

  ngOnInit(): void {
    if (!this.matricula) return;

    const notasExistentes = this.matricula.notasDisciplinas || [];

    this.cursoService.getCursos().subscribe((cursos) => {
      const curso = cursos.find((c) => c.id === this.matricula?.cursoId);
      
      if (curso) {
        this.cursoSelecionado.set(curso);

        if (curso.disciplinas) {
          const listaCompleta = curso.disciplinas.map((d) => {
            const jaExiste = notasExistentes.find((n) => n.disciplinaId === d.id);
            return {
              disciplinaId: d.id,
              disciplinaNome: d.nome,
              notaFinal: jaExiste ? jaExiste.notaFinal : undefined,
            };
          });
          this.notas.set(listaCompleta);
        } else {
          this.notas.set(notasExistentes);
        }
      } else {
        this.notas.set(notasExistentes);
      }
    });
  }

  atualizarNotaDisciplina(disciplinaId: number, valor: number | undefined): void {
    this.notas.update((lista) =>
      lista.map((n) => (n.disciplinaId === disciplinaId ? { ...n, notaFinal: valor } : n))
    );
  }

  salvar(): void {
    if (!this.matricula) return;

    const exigeTcc = this.cursoExigeTcc();

    const tccObjeto = exigeTcc
      ? {
          titulo: this.tccTitulo().trim() || undefined,
          tema: this.tccTema().trim() || undefined,
          tipoTrabalho: this.tccTipoTrabalho().trim() || undefined,
        }
      : undefined;

    const matriculaAtualizada: Matricula = {
      ...this.matricula,
      frequenciaGeralPct: this.frequenciaGeralPct(),
      tcc: tccObjeto,
      notasDisciplinas: this.notas(),
    };

    const alunoAtualizado: Aluno = {
      ...this.aluno,
      matriculas: [matriculaAtualizada],
    };

    this.dialogRef.close(alunoAtualizado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}