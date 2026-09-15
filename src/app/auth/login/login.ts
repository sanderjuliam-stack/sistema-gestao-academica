// login.component.ts
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <div class="login-container">
      <form (ngSubmit)="onSubmit()" class="login-card">
        <h2 class="page-title">Login</h2>
        
        @if (erro()) {
          <div class="error-banner">Usuário ou senha inválidos.</div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Usuário</mat-label>
          <input matInput [(ngModel)]="usuario" name="usuario" required />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Senha</mat-label>
          <input matInput type="password" [(ngModel)]="senha" name="senha" required />
        </mat-form-field>

        <button mat-flat-button color="primary" type="submit">Entrar</button>
      </form>
    </div>
  `,
  styles: [`
    .login-container { 
        display: flex; 
        justify-content: center; 
        align-items: center; 
        height: 100vh; 
        background-color: var(--color-primary); }
    .login-card { 
        display: flex; 
        flex-direction: column; 
        width: 320px; 
        padding: 24px; 
        background: var(--bg-app); 
        border-radius: 8px; 
        box-shadow: var(--shadow-md); 
        gap: 12px; }
    h2 {
        text-align: center;
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  
  usuario = '';
  senha = '';
  readonly erro = signal(false);

  onSubmit(): void {
    const sucesso = this.authService.login(this.usuario, this.senha);
    if (!sucesso) {
      this.erro.set(true);
    }
  }
}