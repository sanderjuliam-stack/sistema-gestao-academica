import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface AvisoVinculoData {
  entidadeNome: string;     // Ex: "Engenharia de Software", "Dr. Carlos", "João Silva"
  tipoEntidade: string;     // Ex: "O curso", "O docente", "O aluno"
  quantidade: number;       // Ex: 3
  tipoVinculo: string;      // Ex: "solicitação", "disciplina" (no singular)
  orientacao?: string;      // Ex: "Remova os vínculos antes de prosseguir."
}

@Component({
  selector: 'app-aviso-vinculo-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="warn">error_outline</mat-icon> Não é possível excluir
    </h2>

    <mat-dialog-content>
      <p>
        {{ data.tipoEntidade }} <strong>{{ data.entidadeNome }}</strong> possui
        <strong>{{ data.quantidade }}</strong>
        {{ data.quantidade === 1 ? data.tipoVinculo : pluralizar(data.tipoVinculo) }}
        {{ data.quantidade === 1 ? 'vinculada' : 'vinculadas' }} a ele(a).
      </p>
      
      @if (data.orientacao) {
        <p class="sub-text">{{ data.orientacao }}</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="dialogRef.close()">
        Entendi
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--status-pending);
      font-size: 1.3rem;
    }
    p {
      font-size: 0.85rem;
      margin-bottom: 8px;
      padding: 0px 10px 0;
    }
    .sub-text {
      padding: 10px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
  `]
})
export class AvisoVinculoDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AvisoVinculoDialogComponent>);
  readonly data = inject<AvisoVinculoData>(MAT_DIALOG_DATA);

  pluralizar(palavra: string): string {
    if (palavra.endsWith('ao')) return palavra.slice(0, -2) + 'oes'; // solicitação -> solicitações
    if (palavra.endsWith('a') || palavra.endsWith('e') || palavra.endsWith('o')) return palavra + 's';
    return palavra + 'es';
  }
}