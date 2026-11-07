import { Link, Navigate, useLocation } from 'react-router-dom';
import { ChevronRight, Sparkles, Target } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { dishById, employeeTotals, isHabilitado, nextSkill, progressOf } from '../lib/metrics';
import { Avatar, Badge, Note, ProgressBar } from '../components/ui';
import { ProgressTabs } from './Avaliacao';

export const Progresso = () => {
  const { db, user, can } = useApp();
  const { state } = useLocation();
  const updated = (state as { updated?: string } | null)?.updated;

  if (!can.seeAllProgress) return <Navigate to={user?.employeeId ? `/progresso/${user.employeeId}` : '/inicio'} replace />;

  return (
    <div className="flex flex-col gap-6">
      <ProgressTabs current="progresso" />
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Progresso da equipe</h1>
        <p className="mt-2 text-muted">Cada barra mostra etapas validadas na prática, em avaliação interna. Vídeo assistido não conta. Cada pessoa tem seu ritmo, por isso não há ranking.</p>
      </header>

      <ul className="grid gap-4 lg:grid-cols-3">
        {db.employees.map((e) => {
          const t = employeeTotals(db, e.id, e.learning);
          const next = nextSkill(db, e.id, e.learning);
          return (
            <li key={e.id}>
              <Link to={`/progresso/${e.id}`} className={`flex h-full flex-col gap-4 rounded-xl2 border bg-surface p-4 transition-colors hover:border-cream/40 sm:p-5 ${updated === e.id ? 'border-orange' : 'border-line'}`}>
                <span className="flex items-center gap-3">
                  <Avatar name={e.name} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold text-cream">{e.name}</span>
                    <span className="block text-sm text-muted">{e.role}</span>
                  </span>
                  <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
                </span>
                {updated === e.id && <span><Badge tone="warn" icon={Sparkles}>Atualizado pela avaliação de agora</Badge></span>}
                <span className="flex flex-col gap-3">
                  {e.learning.map((id) => {
                    const p = progressOf(db, e.id, id);
                    const name = dishById(db, id)?.name;
                    return (
                      <span key={id} className="block">
                        <span className="mb-1.5 flex justify-between gap-2 text-sm"><span className="text-body">{name}</span><span className="shrink-0 tabular-nums text-muted">{p.done} de {p.total} · {p.pct}%</span></span>
                        <ProgressBar value={p.pct} label={`${e.name}, ${name}`} />
                        {isHabilitado(db, e.id, id) && <span className="mt-1.5 block"><Badge tone="ok">Habilitado para o preparo completo</Badge></span>}
                      </span>
                    );
                  })}
                </span>
                <span className="mt-auto border-t border-line pt-3 text-sm">
                  <span className="block text-muted">{t.done} de {t.total} etapas aprovadas</span>
                  <span className="mt-1 flex items-start gap-1.5 text-body"><Target size={15} className="mt-0.5 shrink-0 text-orange" aria-hidden />{next ? `Próxima habilidade: ${next.step.title}` : 'Todas as etapas validadas'}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Note>As avaliações apoiam a decisão de quem acompanha a equipe e não substituem o julgamento culinário. Os nomes e registros são fictícios.</Note>
    </div>
  );
};
