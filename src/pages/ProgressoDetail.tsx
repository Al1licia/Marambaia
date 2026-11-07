import { useMemo, type ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, CirclePlay, ClipboardCheck, Compass, Lightbulb, UserRoundX } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { RESULT_LABEL, dishById, evalAverage, evalsOf, isHabilitado, progressOf, validatedSteps } from '../lib/metrics';
import { fmt1, fmtDate } from '../lib/format';
import { Avatar, Badge, Card, EmptyState, Note, ProgressBar, btnClass } from '../components/ui';

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="p-4 sm:p-5">
    <h2 className="mb-3 text-xl font-semibold">{title}</h2>
    {children}
  </Card>
);

export const ProgressoDetail = () => {
  const { employeeId = '' } = useParams();
  const { db, user, can } = useApp();
  const emp = db.employees.find((e) => e.id === employeeId);
  const allowed = can.seeAllProgress || user?.employeeId === employeeId;

  const data = useMemo(() => {
    if (!emp) return null;
    const evals = evalsOf(db, emp.id);
    const label = (id: string) => db.criteria[evals.find((e) => e.scores[id] !== undefined)?.dishId ?? '']?.find((c) => c.id === id)?.label ?? id;
    const competencies = emp.learning.flatMap((d) => {
      const dish = dishById(db, d);
      const ok = validatedSteps(db, emp.id, d);
      return dish?.steps.filter((s) => ok.has(s.id)).map((s) => ({ dish, step: s })) ?? [];
    });
    const pending = emp.learning.flatMap((d) => {
      const dish = dishById(db, d);
      const ok = validatedSteps(db, emp.id, d);
      return dish?.steps.filter((s) => !ok.has(s.id)).map((s) => ({ dish, step: s })) ?? [];
    });
    const recent = evals.slice(0, 3);
    const low = new Map<string, number>();
    recent.forEach((e) => Object.entries(e.scores).forEach(([k, v]) => { if (v <= 3) low.set(k, (low.get(k) ?? 0) + 1); }));
    const difficulties = [
      ...[...low.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${label(k)} abaixo do padrão em ${n} ${n === 1 ? 'avaliação recente' : 'avaliações recentes'}.`),
      ...(recent.some((e) => e.momentos <= 3) ? ['Reconhecimento dos momentos críticos ainda em desenvolvimento.'] : []),
    ];
    const criticalPending = pending.find((p) => p.step.critical);
    const recommendations = [
      ...(criticalPending ? [{ text: `Preparar junto com o mestre a etapa ${criticalPending.step.title}, de ${criticalPending.dish.name}.`, to: `/videos/${criticalPending.dish.id}?etapa=${criticalPending.step.id}` }] : []),
      ...(recent.some((e) => e.supervisao === 'constante') ? [{ text: 'Manter supervisão próxima nas próximas práticas e reduzir aos poucos.', to: '' }] : []),
      ...(pending.length === 0 ? [{ text: 'Avaliar com a gestão a habilitação para o preparo completo.', to: '' }] : []),
    ];
    const timeline = [
      ...evals.map((e) => ({ at: e.date, text: `${dishById(db, e.dishId)?.name}: ${RESULT_LABEL[e.result].toLowerCase()}${e.stepsApproved.length ? `, ${e.stepsApproved.length} ${e.stepsApproved.length === 1 ? 'etapa validada' : 'etapas validadas'}` : ''}.` })),
      ...emp.activities,
    ].sort((a, b) => b.at.localeCompare(a.at));
    return { evals, competencies, pending, difficulties, recommendations, timeline };
  }, [db, emp]);

  if (!allowed) return <Navigate to={user?.employeeId ? `/progresso/${user.employeeId}` : '/inicio'} replace />;
  if (!emp || !data) {
    return <EmptyState icon={UserRoundX} title="Funcionário não encontrado" action={<Link to="/progresso" className={btnClass()}>Ver equipe</Link>} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {can.seeAllProgress && <Link to="/progresso" className="inline-flex min-h-[44px] items-center gap-1.5 self-start font-semibold text-muted hover:text-cream"><ArrowLeft size={18} aria-hidden />Equipe</Link>}
      <header className="flex items-center gap-4">
        <Avatar name={emp.name} size={64} />
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">{emp.name}</h1>
          <p className="text-muted">{emp.role} · {emp.since}</p>
        </div>
      </header>

      <section aria-label="Progresso por prato" className="grid gap-3 sm:grid-cols-2">
        {emp.learning.map((id) => {
          const p = progressOf(db, emp.id, id);
          return (
            <Card key={id} className="p-4">
              <p className="mb-2 flex justify-between gap-2"><span className="font-semibold text-cream">{dishById(db, id)?.name}</span><span className="shrink-0 tabular-nums text-muted">{p.done} de {p.total} etapas validadas</span></p>
              <ProgressBar value={p.pct} label={`Progresso em ${dishById(db, id)?.name}`} />
              <p className="mt-1.5 text-sm tabular-nums text-muted">Progresso: {p.pct}%</p>
              {isHabilitado(db, emp.id, id) && <div className="mt-2"><Badge tone="ok">Habilitado para o preparo completo</Badge></div>}
            </Card>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Block title="Competências desenvolvidas">
          {data.competencies.length === 0 ? <p className="text-muted">Nenhuma etapa validada ainda.</p> : (
            <ul className="flex flex-col gap-2">
              {data.competencies.map(({ dish, step }) => <li key={step.id} className="flex items-start gap-2"><BadgeCheck size={17} className="mt-0.5 shrink-0 text-cream" aria-hidden /><span>{step.title} <span className="text-sm text-muted">· {dish.name}</span></span></li>)}
            </ul>
          )}
        </Block>
        <Block title="Etapas pendentes">
          {data.pending.length === 0 ? <p className="text-muted">Todas as etapas exigidas foram validadas.</p> : (
            <ul className="flex flex-col gap-1">
              {data.pending.map(({ dish, step }) => (
                <li key={step.id}>
                  <Link to={`/videos/${dish.id}?etapa=${step.id}`} className="flex min-h-[40px] items-center gap-2 rounded-lg hover:text-cream"><CirclePlay size={17} className="shrink-0 text-orange" aria-hidden /><span>{step.title} <span className="text-sm text-muted">· {dish.name}</span></span></Link>
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title="Dificuldades registradas">
          {data.difficulties.length === 0 ? <p className="text-muted">Nenhuma dificuldade nas avaliações recentes.</p> : (
            <ul className="flex flex-col gap-2">{data.difficulties.map((d) => <li key={d} className="flex items-start gap-2"><Compass size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden />{d}</li>)}</ul>
          )}
        </Block>
        <Block title="Recomendações de acompanhamento">
          {data.recommendations.length === 0 ? <p className="text-muted">Seguir com as práticas previstas.</p> : (
            <ul className="flex flex-col gap-2">
              {data.recommendations.map((r) => (
                <li key={r.text} className="flex items-start gap-2"><Lightbulb size={17} className="mt-0.5 shrink-0 text-orange" aria-hidden />
                  {r.to ? <Link to={r.to} className="underline decoration-cream/30 underline-offset-4 hover:text-cream">{r.text}</Link> : r.text}
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Block title="Avaliações internas">
          {data.evals.length === 0 ? <p className="text-muted">Ainda sem avaliações.</p> : (
            <ul className="flex flex-col gap-3">
              {data.evals.map((e) => (
                <li key={e.id} className="rounded-xl bg-raised/50 p-3.5">
                  <p className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-cream">{dishById(db, e.dishId)?.name}</span><span className="text-sm tabular-nums text-muted">{fmtDate(e.date)} · média {fmt1(evalAverage(e))}</span></p>
                  <p className="mt-0.5 text-sm text-muted">{e.batch} · Avaliação de {e.evaluator}</p>
                  <div className="mt-2"><Badge icon={ClipboardCheck} tone={e.result === 'pratica' ? 'warn' : 'neutral'}>{RESULT_LABEL[e.result]}</Badge></div>
                  {e.observacoes && <p className="mt-2 leading-relaxed">{e.observacoes}</p>}
                </li>
              ))}
            </ul>
          )}
        </Block>
        <Block title="Histórico de atividades">
          <ol className="flex flex-col gap-3 border-l border-line pl-4">
            {data.timeline.map((t, i) => <li key={i} className="text-sm leading-relaxed"><p>{t.text}</p><p className="text-muted">{fmtDate(t.at)}</p></li>)}
          </ol>
        </Block>
      </div>
      <Note>Registros apoiam o acompanhamento e não medem o valor de ninguém. O progresso sobe somente com etapas validadas na prática.</Note>
    </div>
  );
};
