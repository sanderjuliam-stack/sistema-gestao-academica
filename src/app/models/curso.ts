import { Disciplina } from './disciplina';

export type NivelCurso = 'GRADUACAO' | 'POS_GRADUACAO' | 'EXTENSAO';

export interface Curso {
  readonly id: number;
  nome: string;
  instituicao: string;
  nivel: NivelCurso;
  areaConhecimento?: string;
  cargaHorariaTotal: number;
  possuiTcc?: boolean;
  disciplinas?: Disciplina[];
}