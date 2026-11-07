import { useMemo, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BookOpenText, ChefHat, Clock, History, ListChecks, Pencil, PlayCircle, Plus, Save, Search, ShieldAlert, Trash2, Users, Utensils } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { dishById } from '../lib/metrics';
import { fmtDate, normalize, today, uid } from '../lib/format';
import { Badge, Button, Card, EmptyState, Field, Modal, Note, btnClass, useToast } from '../components/ui';
import type { Ficha, Ingredient } from '../types';

const Section = ({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) => (
  <Card className={`p-4 sm:p-5 ${className}`}>
    <h2 className="mb-3 text-xl font-semibold">{title}</h2>
    {children}
  </Card>
);

const EditFicha = ({ ficha, onClose }: { ficha: Ficha; onClose: () => void }) => {
  const { update, user } = useApp();
  const toast = useToast();
  const [description, setDescription] = useState(ficha.description);
  const [rendimento, setRendimento] = useState(ficha.rendimento);
  const [observacoes, setObservacoes] = useState(ficha.observacoes);
  const [items, setItems] = useState<Ingredient[]>(ficha.ingredients);
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);

  const setItem = (i: number, patch: Partial<Ingredient>) => setItems(items.map((it, n) => (n === i ? { ...it, ...patch } : it)));

  const save = () => {
    setTried(true);
    if (!note.trim()) return;
    const by = user?.name ?? '';
    const version = ficha.versions[0].version + 1;
    const clean = items.filter((i) => i.item.trim());
    update((d) => ({
      ...d,
      fichas: { ...d.fichas, [ficha.dishId]: { ...ficha, description, rendimento, observacoes, ingredients: clean, updatedAt: today(), versions: [{ version, at: today(), by, note: note.trim() }, ...ficha.versions] } },
      logs: [{ id: uid('log'), dishId: ficha.dishId, at: today(), by, text: `Ficha técnica atualizada para a versão ${version}.` }, ...d.logs],
    }));
    toast(`Versão ${version} da ficha salva.`);
    onClose();
  };

  return (
    <Modal wide title="Editar ficha técnica" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Descrição breve" htmlFor="f-desc"><textarea id="f-desc" rows={2} className="field" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label="Rendimento" htmlFor="f-rend"><input id="f-rend" className="field" value={rendimento} onChange={(e) => setRendimento(e.target.value)} /></Field>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-cream">Ingredientes</p>
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_72px_84px_44px] gap-1.5">
              <input aria-label="Ingrediente" className="field min-w-0" value={it.item} onChange={(e) => setItem(i, { item: e.target.value })} />
              <input aria-label="Quantidade" className="field min-w-0 px-2" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
              <input aria-label="Unidade" className="field min-w-0 px-2" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
              <button type="button" aria-label={`Remover ${it.item}`} onClick={() => setItems(items.filter((_, n) => n !== i))} className="flex items-center justify-center rounded-xl text-muted hover:bg-cream/5 hover:text-cream"><Trash2 size={18} aria-hidden /></button>
            </div>
          ))}
          <Button small variant="ghost" icon={Plus} className="self-start" onClick={() => setItems([...items, { item: '', qty: '', unit: '' }])}>Adicionar ingrediente</Button>
        </div>
        <Field label="Observações técnicas" htmlFor="f-obs"><textarea id="f-obs" rows={2} className="field" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></Field>
        <Field label="O que mudou nesta versão?" htmlFor="f-note" error={tried && !note.trim() ? 'Descreva a mudança para manter o histórico.' : undefined}>
          <input id="f-note" className="field" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button icon={Save} onClick={save}>Salvar nova versão</Button></div>
      </div>
    </Modal>
  );
};

export const FichaDetail = () => {
  const { dishId = '' } = useParams();
  const [params] = useSearchParams();
  const { db, user, can } = useApp();
  const dish = dishById(db, dishId);
  const ficha = db.fichas[dishId];
  const [q, setQ] = useState(params.get('q') ?? '');
  const [simple, setSimple] = useState(false);
  const [editing, setEditing] = useState(false);
  const term = normalize(q.trim());

  const ingredients = useMemo(() => (ficha?.ingredients ?? []).filter((i) => !term || normalize(i.item).includes(term)), [ficha, term]);
  const sequence = useMemo(() => (ficha?.sequencia ?? []).filter((s) => !term || normalize(s.text + s.complemento).includes(term)), [ficha, term]);

  if (!dish || !ficha) {
    return <EmptyState icon={BookOpenText} title="Ficha não encontrada" action={<Link to="/fichas" className={btnClass()}>Ver fichas</Link>}>Escolha uma das fichas cadastradas.</EmptyState>;
  }

  const stepOf = (id: string) => dish.steps.find((s) => s.id === id);
  const learner = user?.role === 'aprendiz';

  return (
    <div className={`flex flex-col gap-5 ${simple ? 'text-lg' : ''}`}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="eyebrow mb-1.5">Ficha técnica · Versão {ficha.versions[0].version}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{dish.name}</h1>
          <p className="mt-2 text-muted">{ficha.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/videos/${dish.id}`} className={btnClass()}><PlayCircle size={18} aria-hidden />Abrir vídeo</Link>
          <Button variant="secondary" aria-pressed={simple} icon={ListChecks} onClick={() => setSimple(!simple)}>{simple ? 'Ficha completa' : 'Modo simplificado'}</Button>
          {can.edit && <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Editar</Button>}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge icon={Users}>{ficha.rendimento}</Badge>
        <Badge icon={ChefHat}>{ficha.validatedBy}</Badge>
        <Badge>Atualizada em {fmtDate(ficha.updatedAt)}</Badge>
      </div>

      <div className="relative max-w-xl">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" aria-label="Buscar nesta ficha" className="field pl-10" placeholder="Buscar nesta ficha" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="Ingredientes">
            {ingredients.length === 0 ? <p className="text-muted">Nenhum ingrediente com esse termo.</p> : (
              <ul className="divide-y divide-line">
                {ingredients.map((i) => (
                  <li key={i.item} className="flex items-baseline justify-between gap-3 py-2">
                    <span>{i.item}</span>
                    <span className="shrink-0 tabular-nums text-cream">{i.qty} {i.unit}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-muted">Quantidades demonstrativas.</p>
          </Section>
          {!simple && (
            <Section title="Tempo e utensílios">
              <p className="flex gap-2 leading-relaxed"><Clock size={18} className="mt-0.5 shrink-0 text-orange" aria-hidden />{ficha.tempo}</p>
              <p className="mt-3 flex gap-2 leading-relaxed"><Utensils size={18} className="mt-0.5 shrink-0 text-orange" aria-hidden />{ficha.utensilios.join(', ')}.</p>
            </Section>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Section title="Sequência de preparo">
            {sequence.length === 0 ? <p className="text-muted">Nenhuma etapa com esse termo.</p> : (
              <ol className="flex flex-col gap-3">
                {sequence.map((s, n) => {
                  const step = stepOf(s.stepId);
                  const blocked = learner && step?.status !== 'aprovado';
                  return (
                    <li key={s.stepId} className="grid gap-3 rounded-xl bg-raised/50 p-3.5 sm:grid-cols-2">
                      <div>
                        <p className="eyebrow">Ficha técnica</p>
                        <p className="mt-1 font-semibold text-cream">{ficha.sequencia.indexOf(s) + 1 || n + 1}. {s.text}</p>
                      </div>
                      {!simple && (
                        <div className="flex flex-col items-start gap-1.5 sm:border-l sm:border-line sm:pl-3">
                          <p className="eyebrow">Complemento prático</p>
                          <p className="text-sm leading-relaxed text-body">{blocked ? 'Trecho em validação pelo mestre.' : s.complemento}</p>
                          {!blocked && <Link to={`/videos/${dish.id}?etapa=${s.stepId}`} className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold text-orange hover:underline"><PlayCircle size={15} aria-hidden />Ver este momento</Link>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </Section>
          <Section title="Critérios sensoriais do mestre">
            <ul className="flex flex-col gap-1.5">{ficha.sensoriais.map((c) => <li key={c} className="leading-relaxed">{c}</li>)}</ul>
          </Section>
        </div>
      </div>

      {!simple && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Segurança alimentar">
            <ul className="flex flex-col gap-2">
              {ficha.seguranca.map((c) => <li key={c} className="flex gap-2 leading-relaxed"><ShieldAlert size={17} className="mt-1 shrink-0 text-orange" aria-hidden />{c}</li>)}
            </ul>
          </Section>
          <div className="flex min-w-0 flex-col gap-4">
            <Section title="Observações técnicas"><p className="leading-relaxed">{ficha.observacoes}</p></Section>
            <Section title="Histórico de versões">
              <ol className="flex flex-col gap-2.5">
                {ficha.versions.map((v) => (
                  <li key={v.version} className="flex gap-2 text-sm leading-relaxed">
                    <History size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                    <span><span className="font-semibold text-cream">Versão {v.version}</span> · {v.note}<span className="block text-muted">{v.by} · {fmtDate(v.at)}</span></span>
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        </div>
      )}

      <Note>Temperaturas e tempos obrigatórios só entram aqui depois de definidos em receita validada. Dados desta ficha são demonstrativos.</Note>
      {editing && <EditFicha ficha={ficha} onClose={() => setEditing(false)} />}
    </div>
  );
};
