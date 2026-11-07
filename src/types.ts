export type Role = 'admin' | 'mestre' | 'aprendiz';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  /** Liga o login de aprendiz ao seu cadastro de funcionário. */
  employeeId?: string;
}

/** registrado (revisao) é diferente de aprovado: só aprovado é referência definitiva. */
export type ContentStatus = 'aprovado' | 'revisao' | 'correcao';

export interface Step {
  id: string;
  title: string;
  description: string;
  critical: boolean;
  observar: string;
  fazer: string;
  evitar: string;
  /** Fala curta do mestre, quando houver. */
  fala?: string;
  status: ContentStatus;
  correction?: string;
}

export type DishArtKind = 'feijoada' | 'carne' | 'caldo' | 'dobradinha';

export interface Dish {
  id: string;
  name: string;
  tagline: string;
  art: DishArtKind;
  /** Foto real do prato, relativa à raiz do site. Sem ela, mostra a ilustração. */
  photo?: string;
  steps: Step[];
}

export interface RecordingCell {
  gesto: string;
  criterio: string;
}

export interface Recording {
  id: string;
  dishId: string;
  label: string;
  date: string;
  occasion: string;
  recordedBy: string;
  consent: boolean;
  /** Duração em segundos; null quando ainda não há vídeo nem marcações. */
  duration: number | null;
  times: Record<string, [number, number]>;
  cells: Record<string, RecordingCell>;
  result: string;
}

export type CompareMarkKind = 'consistente' | 'divergencia' | 'validar';

export interface CompareMark {
  kind?: CompareMarkKind;
  note: string;
  by: string;
  at: string;
}

export interface LogEntry {
  id: string;
  dishId: string;
  at: string;
  by: string;
  text: string;
}

export interface Ingredient {
  item: string;
  qty: string;
  unit: string;
}

export interface FichaStep {
  text: string;
  stepId: string;
  complemento: string;
}

export interface FichaVersion {
  version: number;
  at: string;
  by: string;
  note: string;
}

export interface Ficha {
  dishId: string;
  description: string;
  ingredients: Ingredient[];
  rendimento: string;
  tempo: string;
  utensilios: string[];
  sequencia: FichaStep[];
  sensoriais: string[];
  seguranca: string[];
  observacoes: string;
  updatedAt: string;
  validatedBy: string;
  versions: FichaVersion[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  since: string;
  learning: string[];
  activities: { at: string; text: string }[];
}

export interface Criterion {
  id: string;
  label: string;
  expected: string;
  active: boolean;
}

export type EvalResult = 'aprendizagem' | 'pratica' | 'aprovado' | 'habilitado';
export type Supervision = 'sem' | 'pontual' | 'constante';

export interface Evaluation {
  id: string;
  employeeId: string;
  dishId: string;
  date: string;
  evaluator: string;
  batch: string;
  scores: Record<string, number>;
  sequencia: number;
  momentos: number;
  higiene: number;
  supervisao: Supervision;
  result: EvalResult;
  stepsApproved: string[];
  observacoes: string;
}

export type Expectation = 'sim' | 'nao' | 'nao_sei';
export type FeedbackType = 'elogio' | 'sugestao' | 'reclamacao';

export interface Feedback {
  id: string;
  dishId: string;
  date: string;
  rating: number;
  expected: Expectation;
  attention: string;
  type: FeedbackType;
  comment: string;
}

export interface DB {
  dishes: Dish[];
  recordings: Recording[];
  marks: Record<string, CompareMark>;
  logs: LogEntry[];
  fichas: Record<string, Ficha>;
  employees: Employee[];
  evaluations: Evaluation[];
  feedbacks: Feedback[];
  criteria: Record<string, Criterion[]>;
  lastSeen: Record<string, { dishId: string; stepId: string; at: string }>;
}
