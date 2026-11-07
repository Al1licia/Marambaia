import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CircleDashed, Layers, PlayCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { approvedCount, dishById, dishStatus, employeeTotals, feedbackStats, progressOf } from '../lib/metrics';
import { DishArt } from '../components/DishArt';
import { Badge, Button, Card, ProgressBar, btnClass } from '../components/ui';
import type { Dish } from '../types';

const DishCard = ({ dish }: { dish: Dish }) => {
  const nav = useNavigate();
  const st = dishStatus(dish);
  return (
    <Card className="group flex flex-col overflow-hidden transition-colors hover:border-cream/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-raised">
        {dish.photo ? (
          <img src={`${import.meta.env.BASE_URL}${dish.photo}`} alt={dish.name} className="h-full w-full object-cover" />
        ) : (
          <>
            <DishArt kind={dish.art} label={dish.name} className="h-full w-full" />
            <span className="absolute bottom-2 right-2 rounded bg-ink/85 px-1.5 py-0.5 text-[11px] text-muted">Ilustração</span>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-xl font-semibold">{dish.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{dish.tagline}</p>
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <Badge icon={Layers}>{dish.steps.length} etapas</Badge>
          <Badge tone={st.tone} icon={st.tone === 'ok' ? BadgeCheck : CircleDashed}>{st.label}</Badge>
        </div>
        <Button icon={PlayCircle} onClick={() => nav(`/videos/${dish.id}`)} className="w-full">Aprender preparo</Button>
      </div>
    </Card>
  );
};

const Summary = ({ to, label, value, detail }: { to: string; label: string; value: string; detail: string }) => (
  <Link to={to} className="block p-4 transition-colors hover:bg-raised/60 sm:p-5">
    <span className="block text-sm text-muted">{label}</span>
    <span className="mt-1 block font-display text-3xl font-semibold tabular-nums text-cream">{value}</span>
    <span className="mt-1 block text-sm text-muted">{detail}</span>
  </Link>
);

export const Home = () => {
  const { db, user, can } = useApp();
  if (!user) return null;

  const last = db.lastSeen[user.id];
  const lastDish = last && dishById(db, last.dishId);
  const lastStep = lastDish?.steps.find((s) => s.id === last.stepId);

  const steps = db.dishes.flatMap((d) => d.steps);
  const approved = db.dishes.reduce((a, d) => a + approvedCount(d), 0);
  const pending = steps.length - approved;
  const documented = db.dishes.filter((d) => db.recordings.some((r) => r.dishId === d.id) && db.fichas[d.id]).length;
  const totals = db.employees.map((e) => employeeTotals(db, e.id, e.learning));
  const validated = totals.reduce((a, t) => a + t.done, 0);
  const required = totals.reduce((a, t) => a + t.total, 0);
  const fb = feedbackStats(db.feedbacks);
  const me = user.employeeId ? db.employees.find((e) => e.id === user.employeeId) : undefined;

  const first = user.name.split(' ')[0];
  let resumo: string;
  if (me) {
    const t = employeeTotals(db, me.id, me.learning);
    resumo = `Você já validou ${t.done} de ${t.total} etapas dos pratos que está aprendendo.`;
  } else if (user.role === 'mestre') {
    resumo = pending === 0
      ? 'Todas as etapas registradas já têm o seu aval.'
      : `${pending} ${pending === 1 ? 'etapa espera' : 'etapas esperam'} o seu aval para virar referência da equipe.`;
  } else {
    resumo = `${approved} de ${steps.length} etapas já têm o aval do mestre.`;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-line pb-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold sm:text-5xl">Olá, {first}.</h1>
          <p className="mt-3 text-lg text-body">{resumo}</p>
        </div>
        <Link to="/videos" className={btnClass('primary')}>Ver os preparos <ArrowRight size={18} aria-hidden /></Link>
      </header>

      {user.role === 'admin' && (
        <section aria-label="Resumo da casa" className="grid divide-y divide-line overflow-hidden rounded-xl2 border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-y-0">
          <Summary to="/videos" label="Etapas com aval do mestre" value={`${approved} de ${steps.length}`} detail={`em ${documented} pratos documentados`} />
          <Summary to="/progresso" label="Etapas validadas na prática" value={`${validated} de ${required}`} detail={`${db.employees.length} pessoas em aprendizagem`} />
          <Summary to="/feedback" label="Clientes que acharam dentro do padrão" value={fb.insidePct === null ? 'Sem dados' : `${fb.insidePct}%`} detail={`${fb.knownCount} respostas demonstrativas`} />
        </section>
      )}

      {lastDish && (
        <section aria-label="Continuar aprendendo" className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-line bg-raised/40 px-4 py-3">
          <div className="min-w-0">
            <p className="eyebrow">Continuar aprendendo</p>
            <p className="mt-0.5 font-semibold text-cream">{lastDish.name}{lastStep && <span className="font-normal text-muted"> · {lastStep.title}</span>}</p>
          </div>
          <Link to={`/videos/${lastDish.id}?etapa=${last.stepId}`} className={btnClass('secondary', true)}>Retomar <ArrowRight size={16} aria-hidden /></Link>
        </section>
      )}

      {me && (
        <section aria-label="Seu progresso" className="grid gap-3 sm:grid-cols-2">
          {me.learning.map((id) => {
            const p = progressOf(db, me.id, id);
            return (
              <Link key={id} to={`/progresso/${me.id}`} className="rounded-xl2 border border-line bg-surface p-4 hover:border-cream/40">
                <p className="mb-2 flex justify-between gap-2 text-sm"><span className="font-semibold text-cream">{dishById(db, id)?.name}</span><span className="tabular-nums text-muted">{p.done} de {p.total} etapas validadas</span></p>
                <ProgressBar value={p.pct} label={`Progresso em ${dishById(db, id)?.name}`} />
              </Link>
            );
          })}
        </section>
      )}

      <section aria-label="Pratos da casa">
        <h2 className="mb-4 text-2xl font-semibold sm:text-3xl">Pratos da casa</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {db.dishes.map((d) => <DishCard key={d.id} dish={d} />)}
        </div>
      </section>

      {can.evaluate && user.role === 'mestre' && (
        <p className="text-sm text-muted">Tudo o que está registrado aqui nasceu da sua experiência. Só vira referência para a equipe depois que você aprovar.</p>
      )}
    </div>
  );
};