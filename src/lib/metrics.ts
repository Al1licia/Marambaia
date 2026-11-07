import type { DB, Dish, Evaluation, EvalResult, Feedback } from '../types';
import { avg } from './format';

export const RESULT_LABEL: Record<EvalResult, string> = {
  aprendizagem: 'Em aprendizagem',
  pratica: 'Precisa de mais prática',
  aprovado: 'Aprovado para esta etapa',
  habilitado: 'Habilitado para o preparo completo',
};

/** Regras definidas pela casa para habilitação completa (nunca automática). */
export const RULES = { minEvals: 3, minAverage: 4, minHygiene: 4 };

export const dishById = (db: DB, id: string) => db.dishes.find((d) => d.id === id);
export const approvedCount = (d: Dish) => d.steps.filter((s) => s.status === 'aprovado').length;

export const dishStatus = (d: Dish) => {
  const n = approvedCount(d);
  if (n === d.steps.length) return { label: 'Conteúdo validado', tone: 'ok' as const };
  return { label: `${n} de ${d.steps.length} etapas validadas`, tone: 'warn' as const };
};

const credits = (e: Evaluation) => e.result === 'aprovado' || e.result === 'habilitado';

export const evalsOf = (db: DB, employeeId: string, dishId?: string) =>
  db.evaluations
    .filter((e) => e.employeeId === employeeId && (!dishId || e.dishId === dishId))
    .sort((a, b) => b.date.localeCompare(a.date));

/** Progresso vem só de etapas validadas em avaliação prática. Vídeos assistidos não contam. */
export const validatedSteps = (db: DB, employeeId: string, dishId: string) => {
  const ids = new Set<string>();
  evalsOf(db, employeeId, dishId).filter(credits).forEach((e) => e.stepsApproved.forEach((s) => ids.add(s)));
  return ids;
};

export const progressOf = (db: DB, employeeId: string, dishId: string) => {
  const dish = dishById(db, dishId);
  const total = dish?.steps.length ?? 0;
  const done = validatedSteps(db, employeeId, dishId).size;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
};

export const employeeTotals = (db: DB, employeeId: string, learning: string[]) => {
  const ps = learning.map((d) => progressOf(db, employeeId, d));
  return { done: ps.reduce((a, p) => a + p.done, 0), total: ps.reduce((a, p) => a + p.total, 0) };
};

export const nextSkill = (db: DB, employeeId: string, learning: string[]) => {
  for (const dishId of learning) {
    const dish = dishById(db, dishId);
    const ok = validatedSteps(db, employeeId, dishId);
    const step = dish?.steps.find((s) => !ok.has(s.id));
    if (dish && step) return { dish, step };
  }
  return null;
};

export const isHabilitado = (db: DB, employeeId: string, dishId: string) =>
  evalsOf(db, employeeId, dishId).some((e) => e.result === 'habilitado');

export const evalAverage = (e: Evaluation) => avg(Object.values(e.scores));

export const habilitationChecks = (
  db: DB, employeeId: string, dishId: string,
  draft: { steps: string[]; average: number; higiene: number; supervisao: string },
) => {
  const dish = dishById(db, dishId);
  const known = validatedSteps(db, employeeId, dishId);
  draft.steps.forEach((s) => known.add(s));
  const prior = evalsOf(db, employeeId, dishId);
  const lastAvgs = [draft.average, ...prior.slice(0, RULES.minEvals - 1).map(evalAverage)];
  return [
    { label: 'Todas as etapas do prato validadas', ok: !!dish && known.size === dish.steps.length },
    { label: `Ao menos ${RULES.minEvals} avaliações práticas, contando esta (${prior.length + 1})`, ok: prior.length + 1 >= RULES.minEvals },
    { label: `Média ${RULES.minAverage} ou mais nas últimas avaliações`, ok: avg(lastAvgs) >= RULES.minAverage },
    { label: `Segurança e higiene com nota ${RULES.minHygiene} ou mais`, ok: draft.higiene >= RULES.minHygiene },
    { label: 'Preparo realizado sem supervisão', ok: draft.supervisao === 'sem' },
  ];
};

export const feedbackStats = (list: Feedback[]) => {
  const known = list.filter((f) => f.expected !== 'nao_sei');
  const inside = known.filter((f) => f.expected === 'sim').length;
  return {
    count: list.length,
    average: avg(list.map((f) => f.rating)),
    knownCount: known.length,
    insidePct: known.length ? Math.round((inside / known.length) * 100) : null,
  };
};

/** Observação = cliente disse que fugiu do habitual ou registrou reclamação/sugestão. */
export const isObservation = (f: Feedback) => f.expected === 'nao' || f.type !== 'elogio';

export const observationsByDish = (db: DB, list: Feedback[]) =>
  db.dishes
    .map((d) => {
      const rows = list.filter((f) => f.dishId === d.id);
      return { dish: d, count: rows.filter(isObservation).length, stats: feedbackStats(rows), total: rows.length };
    })
    .sort((a, b) => b.count - a.count);
