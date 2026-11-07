import { Link } from 'react-router-dom';
import { ChevronRight, Film } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { dishStatus } from '../lib/metrics';
import { DishArt } from '../components/DishArt';
import { Badge, PageHeader } from '../components/ui';

export const VideoList = () => {
  const { db } = useApp();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Vídeos Explicativos" title="Escolha um preparo">
        Cada preparo é dividido nos momentos que realmente decidem o prato.
      </PageHeader>
      <ul className="grid gap-3 md:grid-cols-2">
        {db.dishes.map((d) => {
          const count = db.recordings.filter((r) => r.dishId === d.id).length;
          const st = dishStatus(d);
          return (
            <li key={d.id}>
              <Link to={`/videos/${d.id}`} className="flex items-center gap-4 rounded-xl2 border border-line bg-surface p-3 transition-colors hover:border-cream/30">
                <DishArt kind={d.art} label={d.name} className="h-20 w-24 shrink-0 rounded-xl sm:w-28" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold text-cream">{d.name}</span>
                  <span className="mt-1 flex flex-wrap gap-2">
                    <Badge icon={Film}>{count} {count === 1 ? 'gravação' : 'gravações'}</Badge>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </span>
                </span>
                <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
