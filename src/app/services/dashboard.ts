import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { SolicitacaoDocumento } from '../models/solicitacao';
import { SolicitacaoService } from './solicitacao';

export interface KpiSummary {
  total: number;
  realizados: number;
  emAndamento: number;
  pendentes: number;
}

export interface ResumoMensal {
  mesAno: string;
  mesAnoFormatado: string;
  total: number;
  concluidos: number;
  emAndamento: number;
  pendentes: number;
}

export interface OpcaoMes {
  valor: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly solicitacaoService = inject(SolicitacaoService);

  getKpis(): Observable<KpiSummary> {
    return this.solicitacaoService.getSolicitacoes().pipe(
      map((lista) => ({
        total: lista.length,
        realizados: lista.filter((s) => s.entregue).length,
        emAndamento: lista.filter((s) => s.statusEmissao === 'SOLICITADO').length,
        pendentes: lista.filter((s) => s.statusEmissao === 'PENDENTE').length,
      }))
    );
  }

  getUltimosPendentes(limite = 5): Observable<SolicitacaoDocumento[]> {
    return this.solicitacaoService.getSolicitacoes().pipe(
      map((lista) =>
        lista
          .filter((s) => s.statusEmissao === 'PENDENTE')
          .slice(0, limite)
      )
    );
  }

  getMesesDisponiveis(): Observable<OpcaoMes[]> {
    return this.solicitacaoService.getSolicitacoes().pipe(
      map((lista) => {
        const mesesSet = new Set<string>();

        // Obtém o mês atual em fuso local no formato YYYY-MM
        const agora = new Date();
        const anoAtual = agora.getFullYear();
        const mesAtual = String(agora.getMonth() + 1).padStart(2, '0');
        mesesSet.add(`${anoAtual}-${mesAtual}`);

        lista.forEach((item) => {
          if (item.dataSolicitacao) {
            mesesSet.add(item.dataSolicitacao.substring(0, 7));
          }
        });

        return Array.from(mesesSet)
          .sort((a, b) => b.localeCompare(a))
          .map((mesAno) => ({
            valor: mesAno,
            label: this.formatarMesAno(mesAno),
          }));
      })
    );
  }

  getResumoMensal(mesFiltro?: string): Observable<ResumoMensal[]> {
    return this.solicitacaoService.getSolicitacoes().pipe(
      map((lista) => {
        const agrupado = new Map<
          string,
          { total: number; concluidos: number; emAndamento: number; pendentes: number }
        >();

        lista.forEach((item) => {
          const mesAnoKey = item.dataSolicitacao
            ? item.dataSolicitacao.substring(0, 7)
            : new Date().toISOString().substring(0, 7);

          if (mesFiltro && mesAnoKey !== mesFiltro) {
            return;
          }

          const acumulador = agrupado.get(mesAnoKey) || {
            total: 0,
            concluidos: 0,
            emAndamento: 0,
            pendentes: 0,
          };

          acumulador.total++;

          if (item.entregue) {
            acumulador.concluidos++;
          } else if (item.statusEmissao === 'SOLICITADO') {
            acumulador.emAndamento++;
          } else if (item.statusEmissao === 'PENDENTE') {
            acumulador.pendentes++;
          }

          agrupado.set(mesAnoKey, acumulador);
        });

        return Array.from(agrupado.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([mesAno, val]) => ({
            mesAno,
            mesAnoFormatado: this.formatarMesAno(mesAno),
            total: val.total,
            concluidos: val.concluidos,
            emAndamento: val.emAndamento,
            pendentes: val.pendentes,
          }));
      })
    );
  }

  private formatarMesAno(mesAno: string): string {
    const [anoStr, mesStr] = mesAno.split('-');
    const ano = Number(anoStr);
    const mes = Number(mesStr) - 1;

    if (isNaN(ano) || isNaN(mes)) return mesAno;

    const data = new Date(ano, mes, 1);
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    return dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  }
}