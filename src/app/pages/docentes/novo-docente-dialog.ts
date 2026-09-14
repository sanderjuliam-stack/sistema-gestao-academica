import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Docente } from '../../models/docente';

@Component({
  selector: 'app-novo-docente-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ docenteEdicao ? 'Editar Docente' : 'Cadastrar Novo Docente' }}</h2>

    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nome Completo</mat-label>
        <input 
          matInput 
          [(ngModel)]="nome" 
          placeholder="Ex: Dr. Carlos Eduardo" 
          required 
          aria-label="Nome completo do docente" 
        />
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-2">
          <mat-label>E-mail Institucional (Opcional)</mat-label>
          <input 
            matInput 
            [(ngModel)]="email" 
            type="email" 
            placeholder="carlos.eduardo@univ.edu" 
            aria-label="E-mail institucional do docente" 
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Titulação</mat-label>
          <mat-select [(ngModel)]="titulacao" required aria-label="Selecione a titulação do docente">
            <mat-option value="ESPECIALISTA">Especialista</mat-option>
            <mat-option value="MESTRE">Mestre</mat-option>
            <mat-option value="DOUTOR">Doutor</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-footer">
      <button mat-button class="btn-branco" (click)="cancelar()">Cancelar</button>
      <button 
        mat-flat-button 
        class="btn-azul" 
        [disabled]="!formValido()" 
        (click)="salvar()">
        {{ docenteEdicao ? 'Salvar Alterações' : 'Cadastrar Docente' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 480px;
      padding-top: 12px !important;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .full-width { width: 100%; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
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
export class NovoDocenteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<NovoDocenteDialogComponent>);
  readonly docenteEdicao = inject<Docente | null>(MAT_DIALOG_DATA, { optional: true });

  readonly nome = signal(this.docenteEdicao?.nome ?? '');
  readonly email = signal(this.docenteEdicao?.email ?? '');
  readonly titulacao = signal<'ESPECIALISTA' | 'MESTRE' | 'DOUTOR'>(
    this.docenteEdicao?.titulacao ?? 'MESTRE'
  );

  formValido(): boolean {
    const partesNome = this.nome().trim().split(/\s+/);
    return partesNome.length >= 2 && partesNome.every((p) => p.length >= 2);
  }

  salvar(): void {
    if (!this.formValido()) return;

    const docenteResultado: Docente = {
      id: this.docenteEdicao?.id ?? 0,
      nome: this.nome().trim(),
      email: this.email().trim() || undefined,
      titulacao: this.titulacao(),
    };

    this.dialogRef.close(docenteResultado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}