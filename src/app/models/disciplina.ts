export interface Disciplina {
  readonly id: number;
  nome: string;
  cargaHoraria: number;
  docenteId?: number;
  docenteNome?: string;
}