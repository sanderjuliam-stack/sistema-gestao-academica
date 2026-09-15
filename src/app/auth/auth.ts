import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  
  // Usuário fixo (em produção, mover credenciais sensíveis para variáveis de ambiente)
  private readonly USER_VALIDO = environment.authUser;
  private readonly PASS_VALIDO = environment.authPass;

  readonly isAuthenticated = signal<boolean>(
    localStorage.getItem('user_logged') === 'true'
  );

  login(usuario: string, senha: string): boolean {
    if (usuario === this.USER_VALIDO && senha === this.PASS_VALIDO) {
      localStorage.setItem('user_logged', 'true');
      this.isAuthenticated.set(true);
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('user_logged');
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }
}