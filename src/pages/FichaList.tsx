import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, SearchX } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { fmtDate, normalize } from '../lib/format';
import { DishArt } from '../components/DishArt';
import { Button, EmptyState, PageHeader } from '../components/ui';

export const FichaList = () => {
  const { db } = useApp();
  const [q, setQ] = useState('');
  const term = normalize(q.trim());

  const results = useMemo(() => db.dishes.map((d) => {
    const f = db.fichas[d.id];
    if (!term) return { d, f, hits: [] as string[], show: true };
    const hits = [
      ...f.ingredients.filter((i) => normalize(i.item).includes(term)).map((i) => `Ingrediente: ${i.item}`),
      ...f.sequencia.filter((s) => normalize(s.text).includes(term)).map((s) => `Etapa: ${s.text}`),
    ];
    return { d, f, hits, show: normalize(d.name).includes(term) || hits.length > 0 };
  }).filter((r) => r.show), [db, term]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Consulta rápida" title="Fichas Técnicas">
        A ficha organiza a receita. O ponto de cada momento fica no Vídeo Destrinchado.
      </PageHeader>
      <div className="relative max-w-xl">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" aria-label="Buscar por ingrediente ou etapa" className="field pl-10" placeholder="Buscar ingrediente ou etapa. Exemplo: alho" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {results.length === 0 ? (
        <EmptyState icon={SearchX} title="Nada encontrado" action={<Button variant="secondary" onClick={() => setQ('')}>Limpar busca</Button>}>
          Nenhuma ficha cita “{q}”. Tente outro ingrediente ou etapa.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {results.map(({ d, f, hits }) => (
            <li key={d.id}>
              <Link to={`/fichas/${d.id}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`} className="flex items-center gap-4 rounded-xl2 border border-line bg-surface p-3 transition-colors hover:border-cream/30">
                <DishArt kind={d.art} label={d.name} className="h-20 w-24 shrink-0 rounded-xl sm:w-28" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold text-cream">{d.name}</span>
                  <span className="block text-sm text-muted">Versão {f.versions[0].version} · {fmtDate(f.updatedAt)} · {f.rendimento}</span>
                  {hits.slice(0, 2).map((h) => <span key={h} className="mt-0.5 block truncate text-sm text-orange">{h}</span>)}
                </span>
                <ChevronRight size={20} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
