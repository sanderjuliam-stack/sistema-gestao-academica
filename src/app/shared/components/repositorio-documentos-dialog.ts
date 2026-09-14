import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Aluno, DocumentoAnexo, Matricula } from '../../models/aluno';
import { AlunoService } from '../../services/aluno';

export interface RepositorioDialogData {
  aluno: Aluno;
  matricula: Matricula;
}

@Component({
  selector: 'app-repositorio-documentos-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="dialog-header">
      <div class="header-title">
        <mat-icon color="primary">description</mat-icon>
        <h2 mat-dialog-title>Repositório de Documentos</h2>
      </div>
      <p class="subtitle">{{ data.aluno.nome }} — {{ data.matricula.cursoNome }}</p>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- ÁREA DE UPLOAD (DRAG & DROP / FILE INPUT) -->
      <div class="upload-box" (click)="fileInput.click()">
        <input
          #fileInput
          type="file"
          accept="application/pdf,image/*"
          multiple
          style="display: none"
          (change)="onFilesSelected($event)"
        />
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <p class="upload-text">Clique ou arraste arquivos <strong>PDF ou Imagens</strong> para enviar</p>
        <span class="upload-subtext">Armazenamento seguro em nuvem</span>
      </div>

      <!-- BARRA DE PROGRESSO DE UPLOAD -->
      @if (enviando()) {
        <div class="upload-progress">
          <span>Enviando arquivo(s) para o Storage...</span>
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        </div>
      }

      <!-- LISTA DE DOCUMENTOS ARMAZENADOS -->
      <div class="docs-section">
        <h3>Documentos Cadastrados ({{ documentos().length }})</h3>

        @if (documentos().length === 0) {
          <p class="empty-msg">Nenhum documento anexado no storage até o momento.</p>
        } @else {
          <div class="docs-list">
            @for (doc of documentos(); track doc.id) {
              <div class="doc-item">
                <div class="doc-info">
                  <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
                  <div class="doc-details">
                    <a [href]="doc.url" target="_blank" rel="noopener noreferrer" class="doc-name">
                      {{ doc.nome }}
                    </a>
                    <span class="doc-date">Enviado em {{ doc.dataUpload }}</span>
                  </div>
                </div>

                <div class="doc-actions">
                  <a
                    mat-icon-button
                    [href]="doc.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    matTooltip="Visualizar / Download"
                  >
                    <mat-icon color="primary">open_in_new</mat-icon>
                  </a>
                  <button
                    mat-icon-button
                    color="warn"
                    matTooltip="Remover arquivo"
                    (click)="removerDocumento(doc.id)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="salvando() || enviando()"
        (click)="salvar()"
      >
        <mat-icon>save</mat-icon>
        {{ salvando() ? 'Salvando...' : 'Salvar Alterações' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      padding: 16px 10px 10px 24px;
      .header-title {
        display: flex;
        align-items: baseline;
        gap: 8px;
        h2 { 
          margin-bottom: 2px; 
          font-size: 1.3rem; 
          padding: 0 2px;
        }
        mat-icon {
          color: var(--color-primary);
        }
      }
      .subtitle {
        margin: 4px 0 0 32px;
        color: var(--color-primary);
        font-size: 0.9rem;
      }
    }
    .dialog-content {
      padding: 16px 24px !important;
      min-width: 520px;
    }
    .upload-box {
      border: 2px dashed var(--color-primary);
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      background: var(--bg-surface);
      cursor: pointer;
      transition: all 0.2s ease-in-out;

      &:hover {
        border-color: var(--color-primary-hover);
        background: var(--bg-repo);
      }

      .upload-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--color-primary);
      }
      .upload-text {
        margin: 8px 0 4px 0;
        color: var(--text-primary);
        font-size: 0.95rem;
      }
      .upload-subtext {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
    }
    .upload-progress {
      margin-top: 12px;
      span {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
    }
    .docs-section {
      margin-top: 20px;
      h3 {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase;
        margin-bottom: 12px;
      }
    }
    .docs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 220px;
      overflow-y: auto;
    }
    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-surface);

      .doc-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .pdf-icon {
          color: var(--status-rejected);
        }

        .doc-details {
          display: flex;
          flex-direction: column;

          .doc-name {
            font-weight: 600;
            font-size: 0.88rem;
            color: var(--color-primary);
            text-decoration: none;
            &:hover { text-decoration: underline; }
          }
          .doc-date {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }
        }
      }
      .doc-actions {
        display: flex;
        gap: 4px;
      }
    }
    .empty-msg {
      color: var(--text-secondary);
      font-style: italic;
      font-size: 0.88rem;
    }
  `],
})
export class RepositorioDocumentosDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<RepositorioDocumentosDialogComponent>);
  private readonly alunoService = inject(AlunoService);
  private readonly snackBar = inject(MatSnackBar);

  readonly data = inject<RepositorioDialogData>(MAT_DIALOG_DATA);

  readonly documentos = signal<DocumentoAnexo[]>(
    this.data.matricula.documentos ?? []
  );

  readonly enviando = signal(false);
  readonly salvando = signal(false);

  // Manipula a seleção de arquivos local e envia para o Storage
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.enviando.set(true);
    const filesArray = Array.from(input.files);

    // SUBSTINUA ESTE BLOCO PELA SUA CHAMADA DE SERVIÇO DE STORAGE (S3, Firebase, Supabase, etc.)
    // Exemplo: this.storageService.upload(file)...
    setTimeout(() => {
      const novosDocs: DocumentoAnexo[] = filesArray.map((file) => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        nome: file.name,
        // URL retornado pelo seu Storage após o upload:
        url: URL.createObjectURL(file), 
        dataUpload: new Date().toLocaleDateString('pt-BR'),
      }));

      this.documentos.update((atuais) => [...atuais, ...novosDocs]);
      this.enviando.set(false);
      this.snackBar.open('Arquivo(s) carregado(s) no Storage com sucesso!', 'OK', { duration: 3000 });
    }, 1200);
  }

  removerDocumento(docId: string): void {
    this.documentos.update((atuais) => atuais.filter((doc) => doc.id !== docId));
  }

  salvar(): void {
    this.salvando.set(true);

    const matriculasAtualizadas = this.data.aluno.matriculas.map((m) =>
      m.id === this.data.matricula.id
        ? { ...m, documentos: this.documentos() }
        : m
    );

    const alunoAtualizado: Aluno = {
      ...this.data.aluno,
      matriculas: matriculasAtualizadas,
    };

    this.alunoService.atualizarAluno(alunoAtualizado).subscribe({
      next: () => {
        this.snackBar.open('Documentos atualizados no cadastro do aluno!', 'OK', { duration: 3000 });
        this.dialogRef.close(alunoAtualizado);
      },
      error: () => {
        this.snackBar.open('Erro ao salvar os documentos.', 'OK', { duration: 3000 });
        this.salvando.set(false);
      },
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }
}