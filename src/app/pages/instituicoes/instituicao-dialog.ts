import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Instituicao } from '../../models/curso';

@Component({
  selector: 'app-instituicao-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
  <h2 mat-dialog-title>{{ instituicaoEdicao ? 'Editar Instituição' : 'Nova Instituição' }}</h2>
  
  <!-- Conteúdo interno -->
  <mat-dialog-content class="dialog-content">
    <form [formGroup]="form" class="step-form">
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nome da Instituição</mat-label>
        <input matInput formControlName="nome" placeholder="Ex: Faculdade Central de Tecnologia" aria-label="Nome da instituição" />
        @if (form.get('nome')?.hasError('required')) {
          <mat-error>Campo obrigatório</mat-error>
        }
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>CNPJ</mat-label>
          <input matInput formControlName="cnpj" placeholder="00.000.000/0001-00" aria-label="CNPJ da instituição" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>Telefone</mat-label>
          <input matInput formControlName="telefone" placeholder="(00) 00000-0000" aria-label="Telefone de contato" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Endereço</mat-label>
        <input matInput formControlName="endereco" placeholder="Rua, Número, Bairro, Cidade - UF" aria-label="Endereço" />
      </mat-form-field>

    </form>
  </mat-dialog-content>

  <!-- RODAPÉ FIXO -->
  <mat-dialog-actions align="end" class="dialog-actions">
    <button mat-button type="button" (click)="cancelar()" aria-label="Cancelar cadastro">Cancelar</button>

    <button
      mat-flat-button
      color="primary"
      type="button"
      [disabled]="form.invalid"
      (click)="salvar()"
      aria-label="Salvar instituição">
      {{ instituicaoEdicao ? 'Salvar Alterações' : 'Finalizar Cadastro' }}
    </button>
  </mat-dialog-actions>
  `,
  styles: [`
  .dialog-content {
    width: 100%;
    max-height: 60vh;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    padding: 0 16px 16px 16px;
  }

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

  .flex-1 { flex: 1; min-width: 0; }
  .full-width { width: 100%; min-width: 0; }
  `],
})
export class InstituicaoDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InstituicaoDialogComponent>);

  readonly instituicaoEdicao = inject<Instituicao | null>(MAT_DIALOG_DATA, { optional: true });

  readonly form: FormGroup = this.fb.group({
    nome: [this.instituicaoEdicao?.nome ?? '', Validators.required],
    cnpj: [this.instituicaoEdicao?.cnpj ?? ''],
    telefone: [this.instituicaoEdicao?.telefone ?? ''],
    endereco: [this.instituicaoEdicao?.endereco ?? ''],
  });

  ngOnInit(): void {}

  salvar(): void {
    if (this.form.invalid) return;

    const valores = this.form.value;

    const instituicaoResultado: Instituicao = {
      id: this.instituicaoEdicao?.id ?? 0,
      nome: valores.nome.trim(),
      cnpj: valores.cnpj?.trim() || undefined,
      telefone: valores.telefone?.trim() || undefined,
      endereco: valores.endereco?.trim() || undefined,
    };

    this.dialogRef.close(instituicaoResultado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}