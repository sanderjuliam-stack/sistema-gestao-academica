import { Disciplina } from './disciplina';

export type NivelCurso = 'GRADUACAO' | 'POS_GRADUACAO' | 'EXTENSAO';

export interface Instituicao {
  readonly id?: number;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
  quantidadeCursos?: number;
}

export interface Curso {
  readonly id?: number;
  nome: string;
  instituicao: Instituicao; // Ou instituicaoId: number se preferir enviar apenas o ID
  nivel: NivelCurso;
  areaConhecimento?: string;
  cargaHorariaTotal: number;
  possuiTcc?: boolean;
  preco: number;
  disciplinas?: Disciplina[];
}