import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmarExclusaoData {
  quantidade: number;
}

@Component({
  selector: 'app-confirmar-exclusao-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="warn">warning</mat-icon> Confirmar Exclusão
    </h2>

    <mat-dialog-content>
      <p class="warning-text">Tem certeza? Deletar vai excluir as informações permanentemente.</p>
      @if (data.quantidade > 0) {
        <p class="items-count">
          <strong>{{ data.quantidade }}</strong>
          {{ data.quantidade === 1 ? 'item será excluído' : 'itens serão excluídos' }}.
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions" align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">
        <mat-icon>delete</mat-icon> Deletar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--status-pending);
        font-size: 1.3rem;
      }
      .warning-text {
        font-size: 0.85rem;
        margin-bottom: 8px;
        padding: 0px 10px 0;
      }
      .items-count {
        padding: 10px;
        font-size: 0.85rem;
        color: var(--text-secondary);
      }
      .dialog-actions {
        display: flex;
        justify-content: space-around;
      }
    `,
  ],
})
export class ExclusaoConfirmacaoDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ExclusaoConfirmacaoDialogComponent>);
  readonly data = inject<ConfirmarExclusaoData>(MAT_DIALOG_DATA);
}
