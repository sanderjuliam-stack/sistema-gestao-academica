export type StatusEmissao = 'PENDENTE' | 'SOLICITADO' | 'EMITIDO';
export type TipoDocumento = 'CERTIFICADO' | 'DECLARACAO_CONCLUSAO' | 'HISTORICO_ESCOLAR';
export type FormaEntrega = 'E-MAIL' | 'CORREIOS';

export interface SolicitacaoDocumento {
  readonly id: number;
  readonly alunoId?: number;
  readonly cursoId?: number;
  alunoNome: string;
  alunoCpf: string;
  cursoNome: string;
  tipoDocumento: TipoDocumento;
  dataSolicitacao: string; // Formato YYYY-MM-DD
  statusEmissao: StatusEmissao;
  dataEmissao?: string;
  entregue: boolean;
  dataEntrega?: string;
  formaEntrega?: FormaEntrega;
  linkDocumentos?: string;
  observacoes?: string;
}