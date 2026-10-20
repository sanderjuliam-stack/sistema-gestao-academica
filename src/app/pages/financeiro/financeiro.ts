import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, forkJoin, of } from 'rxjs';

import { Instituicao } from '../../models/curso';
import { Curso } from '../../models/curso';
import { Aluno } from '../../models/aluno';
import { InstituicaoService } from '../../services/instituicao';
import { CursoService } from '../../services/curso';
import { AlunoService } from '../../services/aluno';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  templateUrl: './financeiro.html',
  styleUrl: './financeiro.scss',
})
export class FinanceiroComponent implements OnInit {
  private readonly instituicaoService = inject(InstituicaoService);
  private readonly cursoService = inject(CursoService);
  private readonly alunoService = inject(AlunoService);
  private readonly snackBar = inject(MatSnackBar);

  readonly instituicoes = signal<Instituicao[]>([]);
  readonly cursos = signal<Curso[]>([]);
  readonly alunos = signal<Aluno[]>([]);

  // Filtros selecionados
  readonly instituicaoSelecionada = signal<Instituicao | null>(null);
  readonly cursoSelecionadoId = signal<number | 'todos'>('todos');
  readonly competenciaSelecionada = signal<string>(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  readonly vencimentoRepasse = signal<string>('');

  // Cursos filtrados pela instituição escolhida
  readonly cursosDaInstituicao = computed(() => {
    const inst = this.instituicaoSelecionada();
    if (!inst) return [];
    return this.cursos().filter((c) => c.instituicao?.id === inst.id);
  });

  // Matrículas filtradas conforme os selects
  readonly matriculasFiltradas = computed(() => {
    const inst = this.instituicaoSelecionada();
    if (!inst) return [];

    const idsCursosInst = this.cursosDaInstituicao().map((c) => c.id);
    const cursoFiltroId = this.cursoSelecionadoId();

    return this.alunos().flatMap((aluno) => {
      return (aluno.matriculas || [])
        .filter((m) => {
        const pertenceInst = idsCursosInst.includes(m.cursoId);
        const atendeCurso = cursoFiltroId === 'todos' || m.cursoId === cursoFiltroId;
        return pertenceInst && atendeCurso;
      })
      .map((m) => ({
        ...m,
        alunoNome: aluno.nome,
        cursoObj: this.cursos().find((c) => c.id === m.cursoId),
      }));
    });
  });

  // Cálculos financeiros
  readonly arrecadacaoTotal = computed(() => {
    return this.matriculasFiltradas().reduce((acc, m) => {
      const precoCurso = m.cursoObj?.preco || 0;
      return acc + precoCurso;
    }, 0);
  });

  readonly totalMatriculasCount = computed(() => {
    return this.matriculasFiltradas().length;
  });

  // Matrículas novas na competência selecionada (ex: '2026-10')
  readonly matriculasNovasCompetencia = computed(() => {
    const comp = this.competenciaSelecionada(); // 'YYYY-MM'
    return this.matriculasFiltradas().filter((m) => m.dataInicio?.startsWith(comp)).length;
  });

  // Cálculo do Repasse a Arnaldo (Ex: R$ 200 de software + R$ 300 por matrícula nova)
  readonly valorRepasseArnaldo = computed(() => {
    const taxaSoftware = 200;
    const taxaPorMatriculaNova = 300;
    return taxaSoftware + (this.matriculasNovasCompetencia() * taxaPorMatriculaNova);
  });

  ngOnInit(): void {
    forkJoin({
      instituicoes: this.instituicaoService.getInstituicoes().pipe(catchError(() => of([]))),
      cursos: this.cursoService.getCursos().pipe(catchError(() => of([]))),
      alunos: this.alunoService.getAlunos().pipe(catchError(() => of([]))),
    }).subscribe(({ instituicoes, cursos, alunos }) => {
      this.instituicoes.set(instituicoes);
      this.cursos.set(cursos);
      this.alunos.set(alunos);

      // Seleciona a primeira instituição por padrão, se houver
      if (instituicoes.length > 0) {
        this.instituicaoSelecionada.set(instituicoes[0]);
      }
    });
  }

  onInstituicaoChange(inst: Instituicao): void {
    this.instituicaoSelecionada.set(inst);
    this.cursoSelecionadoId.set('todos');
  }

  exportarResumo(): void {
    this.snackBar.open('Resumo financeiro exportado com sucesso!', 'OK', { duration: 3000 });
  }
}