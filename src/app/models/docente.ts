export type TitulacaoDocente = 'ESPECIALISTA' | 'MESTRE' | 'DOUTOR';

export interface Docente {
  readonly id: number;
  nome: string;
  email?: string;
  titulacao: TitulacaoDocente;
}