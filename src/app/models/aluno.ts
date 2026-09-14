export type TipoDocumentoAnexo = 'RG' | 'CPF' | 'COMPROVANTE_RESIDENCIA' | 'HISTORICO' | 'OUTRO';


export interface DocumentoAnexo {
  readonly id: string;
  nome: string;
  url: string;
  dataUpload: string;
  tipo?: TipoDocumentoAnexo;
}

export interface NotaDisciplina {
  readonly disciplinaId: number;
  disciplinaNome: string;
  notaFinal?: number;
}

export interface TccAluno {
  titulo?: string;
  tema?: string;
  tipoTrabalho?: string;
}

export interface Matricula {
  readonly id: number;
  readonly alunoId: number;
  readonly cursoId: number;
  cursoNome: string;
  dataInicio?: string;
  dataTermino?: string;
  frequenciaGeralPct?: number;
  tcc?: TccAluno;
  linkDocumentos?: string;
  documentos?: DocumentoAnexo[];
  notasDisciplinas?: NotaDisciplina[];
}

export interface Aluno {
  readonly id: number;
  cpf: string;
  nome: string;
  dataNascimento?: string;
  naturalidadeCidade?: string;
  naturalidadeUf?: string;
  email?: string;
  matriculas: Matricula[];
}