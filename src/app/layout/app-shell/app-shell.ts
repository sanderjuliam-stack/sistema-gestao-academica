import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// Módulos do Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShellComponent {
  readonly isCollapsed = signal<boolean>(false);

  readonly navItems = signal<NavItem[]>([
    { label: 'Painel de Controle', icon: 'dashboard', route: '/dashboard' },
    { label: 'Alunos & Matrículas', icon: 'people', route: '/alunos' },
    { label: 'Cursos & Disciplinas', icon: 'school', route: '/cursos' },
    { label: 'Docentes & Cadastro', icon: 'psychology', route: '/docentes' },
    { label: 'Solicitações & Docs', icon: 'assignment', route: '/solicitacoes' },
    { label: 'Consultas & Planilhas', icon: 'find_in_page', route: '/consulta' },
  ]);

  toggleSidenav(): void {
    this.isCollapsed.update((prev) => !prev);
  }
}