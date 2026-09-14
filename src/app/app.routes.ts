import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/app-shell/app-shell';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', redirectTo: 'solicitacoes', pathMatch: 'full' },
      {
        path: 'solicitacoes',
        loadComponent: () =>
          import('./pages/solicitacoes/solicitacoes').then((m) => m.SolicitacoesComponent),
      },
      {
        path: 'alunos',
        loadComponent: () =>
          import('./pages/alunos/alunos').then((m) => m.AlunosComponent),
      },
      {
        path: 'cursos',
        loadComponent: () =>
          import('./pages/cursos/cursos').then((m) => m.CursosComponent),
      },
      {
        path: 'docentes',
        loadComponent: () =>
          import('./pages/docentes/docentes').then((m) => m.DocentesComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'consulta',
        loadComponent: () =>
          import('./pages/consulta-alunos/consulta-alunos').then((m) => m.ConsultaAlunosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'solicitacoes' },
];