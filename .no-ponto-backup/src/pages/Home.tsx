import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BookOpenCheck, CircleDashed, Layers, PlayCircle, Sprout, Target, type LucideIcon } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { approvedCount, dishById, dishStatus, employeeTotals, feedbackStats, progressOf } from '../lib/metrics';
import { DishArt } from '../components/DishArt';
import { Badge, Button, Card, ProgressBar, btnClass } from '../components/ui';
import type { Dish } from '../types';

const DishCard = ({ dish }: { dish: Dish }) => {
  const nav = useNavigate();
  const st = dishStatus(dish);
  return (
    <Card className="group flex flex-col overflow-hidden transition-colors hover:border-cream/30">
      <div className="relative aspect-[16/10] overflow-hidden">
        <DishArt kind={dish.art} label={dish.name} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="absolute bottom-2 right-2 rounded-md bg-ink/75 px-1.5 py-0.5 text-[11px] text-muted">Ilustração</span>
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

const Dimension = ({ icon: Icon, title, value, detail, to }: { icon: LucideIcon; title: string; value: string; detail: string; to: string }) => (
  <Link to={to} className="group rounded-xl2 border border-line bg-surface p-4 transition-colors hover:border-cream/30 sm:p-5">
    <span className="flex items-center justify-between text-sm font-semibold text-cream">
      <span className="flex items-center gap-2"><Icon size={17} className="text-orange" aria-hidden />{title}</span>
      <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
    </span>
    <span className="mt-2 block font-display text-3xl font-semibold tabular-nums text-cream">{value}</span>
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
  const documented = db.dishes.filter((d) => db.recordings.some((r) => r.dishId === d.id) && db.fichas[d.id]).length;
  const totals = db.employees.map((e) => employeeTotals(db, e.id, e.learning));
  const validated = totals.reduce((a, t) => a + t.done, 0);
  const required = totals.reduce((a, t) => a + t.total, 0);
  const fb = feedbackStats(db.feedbacks);
  const me = user.employeeId ? db.employees.find((e) => e.id === user.employeeId) : undefined;

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-5xl">Seja bem-vindo ao Ponto Zero!</h1>
        <p className="mt-3 text-lg text-muted">Cada prato tem uma história. Selecione um prato para aprender e preservar essa tradição.</p>
      </header>

      {user.role === 'admin' && (
        <section aria-label="Resumo da casa" className="grid gap-3 md:grid-cols-3">
          <Dimension icon={BookOpenCheck} title="Conhecimento" to="/videos" value={`${approved} de ${steps.length}`} detail={`etapas aprovadas pelo mestre em ${documented} pratos documentados`} />
          <Dimension icon={Sprout} title="Pessoas" to="/progresso" value={`${db.employees.length} pessoas`} detail={`em aprendizagem, com ${validated} de ${required} etapas exigidas já validadas na prática`} />
          <Dimension icon={Target} title="Consistência" to="/feedback" value={fb.insidePct === null ? 'Sem dados' : `${fb.insidePct}%`} detail={`dos clientes que conhecem o prato o acharam dentro do padrão (${fb.knownCount} respostas demonstrativas)`} />
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
              <Link key={id} to={`/progresso/${me.id}`} className="rounded-xl2 border border-line bg-surface p-4 hover:border-cream/30">
                <p className="mb-2 flex justify-between gap-2 text-sm"><span className="font-semibold text-cream">{dishById(db, id)?.name}</span><span className="tabular-nums text-muted">{p.done} de {p.total} etapas validadas</span></p>
                <ProgressBar value={p.pct} label={`Progresso em ${dishById(db, id)?.name}`} />
              </Link>
            );
          })}
        </section>
      )}

      <section aria-label="Pratos da casa">
        <h2 className="mb-4 text-2xl font-semibold">Pratos da casa</h2>
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
