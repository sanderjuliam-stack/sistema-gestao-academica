import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SolicitacaoDocumento, TipoDocumento } from '../../models/solicitacao';
import { DashboardService, KpiSummary, OpcaoMes, ResumoMensal } from '../../services/dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly kpis = signal<KpiSummary>({ total: 0, realizados: 0, emAndamento: 0, pendentes: 0 });
  readonly pendentes = signal<SolicitacaoDocumento[]>([]);

  // Define o mês atual em formato YYYY-MM como valor padrão
  private readonly mesAtualPadrao = new Date().toISOString().substring(0, 7);

  readonly opcoesMeses = signal<OpcaoMes[]>([]);
  readonly mesSelecionado = signal<string>(this.mesAtualPadrao);
  readonly resumoMensal = signal<ResumoMensal[]>([]);

  readonly tipoDocumentoMap: Record<TipoDocumento, string> = {
    CERTIFICADO: 'Certificado',
    DECLARACAO_CONCLUSAO: 'Declaração de Conclusão',
    HISTORICO_ESCOLAR: 'Histórico Escolar',
  };

  // Cálculo reativo da taxa de conclusão
  readonly taxaConclusao = computed(() => {
    const { total, realizados } = this.kpis();
    if (!total) return 0;
    return Math.round((realizados / total) * 100);
  });

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  private carregarDadosIniciais(): void {
    forkJoin({
      kpis: this.dashboardService.getKpis(),
      pendentes: this.dashboardService.getUltimosPendentes(5),
      meses: this.dashboardService.getMesesDisponiveis(),
    }).subscribe(({ kpis, pendentes, meses }) => {
      this.kpis.set(kpis);
      this.pendentes.set(pendentes);
      this.opcoesMeses.set(meses);

      const possuiMesAtual = meses.some((m) => m.valor === this.mesAtualPadrao);
      if (!possuiMesAtual && meses.length > 0) {
        this.mesSelecionado.set(meses[0].valor);
      }

      this.carregarResumo();
    });
  }

  onMesChange(mes: string): void {
    this.mesSelecionado.set(mes);
    this.carregarResumo();
  }

  private carregarResumo(): void {
    const filtro = this.mesSelecionado() || undefined;
    this.dashboardService.getResumoMensal(filtro).subscribe((dados) => {
      this.resumoMensal.set(dados);
    });
  }

  formatarTipoDoc(tipo: TipoDocumento): string {
    return this.tipoDocumentoMap[tipo] || tipo;
  }

  irParaSolicitacoes(solicitacaoId?: number): void {
    if (solicitacaoId) {
      this.router.navigate(['/solicitacoes'], { queryParams: { id: solicitacaoId } });
    } else {
      this.router.navigate(['/solicitacoes']);
    }
  }
}