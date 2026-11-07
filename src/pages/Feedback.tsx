import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FilterX, Lock, MessageSquarePlus, MessagesSquare, Send, Star } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { dishById, feedbackStats, observationsByDish } from '../lib/metrics';
import { fmt1, fmtDate, today, uid } from '../lib/format';
import { Badge, Button, Card, EmptyState, Field, Modal, Note, PageHeader, ScorePicker, Stat, btnClass, useToast } from '../components/ui';
import type { Expectation, Feedback, FeedbackType } from '../types';

const ATTENTION = ['Sabor', 'Tempero', 'Textura', 'Apresentação', 'Porção'];
const EXPECT_LABEL: Record<Expectation, string> = { sim: 'Dentro do padrão', nao: 'Fora do padrão', nao_sei: 'Não sabe avaliar' };
const TYPE_LABEL: Record<FeedbackType, string> = { elogio: 'Elogio', sugestao: 'Sugestão', reclamacao: 'Reclamação' };

const inferType = (rating: number, expected: Expectation): FeedbackType => {
  if (rating >= 4 && expected !== 'nao') return 'elogio';
  return rating <= 3 && (rating < 3 || expected === 'nao') ? 'reclamacao' : 'sugestao';
};

const FeedbackForm = ({ onClose }: { onClose: () => void }) => {
  const { db, update } = useApp();
  const toast = useToast();
  const [dishId, setDishId] = useState('');
  const [rating, setRating] = useState(0);
  const [expected, setExpected] = useState<Expectation | ''>('');
  const [attention, setAttention] = useState('');
  const [comment, setComment] = useState('');
  const [tried, setTried] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!dishId || !rating || !expected || !attention) return;
    const item: Feedback = { id: uid('fb'), dishId, date: today(), rating, expected, attention, comment: comment.trim(), type: inferType(rating, expected) };
    update((d) => ({ ...d, feedbacks: [item, ...d.feedbacks] }));
    toast('Avaliação registrada. Os indicadores foram atualizados.');
    onClose();
  };

  return (
    <Modal title="Avaliação do cliente" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted">Formulário demonstrativo. Não pedimos nome, telefone ou outros dados pessoais.</p>
        <Field label="Prato consumido" htmlFor="fb-dish" error={tried && !dishId ? 'Selecione o prato.' : undefined}>
          <select id="fb-dish" className="field" value={dishId} onChange={(e) => setDishId(e.target.value)}>
            <option value="">Selecione</option>
            {db.dishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Nota de 1 a 5" error={tried && !rating ? 'Escolha uma nota.' : undefined}><ScorePicker label="Nota do prato" value={rating} onChange={setRating} /></Field>
        <Field label="O sabor estava como você esperava?" error={tried && !expected ? 'Escolha uma opção.' : undefined}>
          <div role="radiogroup" aria-label="O sabor estava como você esperava?" className="grid gap-1.5 sm:grid-cols-3">
            {([['sim', 'Sim'], ['nao', 'Não'], ['nao_sei', 'Não sei avaliar']] as [Expectation, string][]).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={expected === v} onClick={() => setExpected(v)} className={`min-h-[48px] rounded-xl border px-2 font-semibold transition-colors ${expected === v ? 'border-brand bg-brand text-cream' : 'border-line text-muted hover:text-cream'}`}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="O que mais chamou sua atenção?" htmlFor="fb-att" error={tried && !attention ? 'Selecione uma opção.' : undefined}>
          <select id="fb-att" className="field" value={attention} onChange={(e) => setAttention(e.target.value)}>
            <option value="">Selecione</option>
            {ATTENTION.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Comentário (opcional)" htmlFor="fb-c"><textarea id="fb-c" rows={3} className="field" value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" icon={Send}>Registrar</Button></div>
      </form>
    </Modal>
  );
};

const initial = { dish: '', period: '', rating: '', expected: '', type: '' };

export const FeedbackPage = () => {
  const { db, can } = useApp();
  const [f, setF] = useState(initial);
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    const now = Date.now();
    return db.feedbacks
      .filter((x) => (!f.dish || x.dishId === f.dish)
        && (!f.period || (now - new Date(x.date).getTime()) / 864e5 <= Number(f.period))
        && (!f.rating || x.rating === Number(f.rating))
        && (!f.expected || x.expected === f.expected)
        && (!f.type || x.type === f.type))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.feedbacks, f]);

  if (!can.feedback) {
    return <EmptyState icon={Lock} title="Área da gestão" action={<Link to="/inicio" className={btnClass()}>Voltar para o início</Link>}>
      O feedback dos clientes é acompanhado pelo administrador. Quando houver algo ligado ao preparo, a gestão conversa com a cozinha.
    </EmptyState>;
  }

  const stats = feedbackStats(list);
  const byDish = observationsByDish(db, list).filter((r) => r.total > 0);
  const top = byDish[0];
  const active = Object.values(f).some(Boolean);
  const select = (key: keyof typeof initial, label: string, options: [string, string][]) => (
    <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold text-cream">
      {label}
      <select className="field font-normal" value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}>
        <option value="">Todos</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Percepção de quem consome" title="Feedback dos Clientes" actions={<Button icon={MessageSquarePlus} onClick={() => setAdding(true)}>Registrar avaliação</Button>}>
        Os clientes continuam reconhecendo o sabor da casa? Esta visão é separada da avaliação sensorial interna.
      </PageHeader>

      <Note>Dados fictícios, apenas demonstrativos. Eles não representam resultados de campo.</Note>

      <section aria-label="Filtros" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {select('dish', 'Prato', db.dishes.map((d) => [d.id, d.name]))}
        {select('period', 'Período', [['7', 'Últimos 7 dias'], ['30', 'Últimos 30 dias'], ['90', 'Últimos 90 dias']])}
        {select('rating', 'Nota', ['5', '4', '3', '2', '1'].map((n) => [n, n]))}
        {select('expected', 'Padrão', Object.entries(EXPECT_LABEL))}
        {select('type', 'Comentário', Object.entries(TYPE_LABEL))}
      </section>

      {list.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="Nenhuma avaliação com estes filtros" action={<Button variant="secondary" icon={FilterX} onClick={() => setF(initial)}>Limpar filtros</Button>}>
          Amplie o período ou remova algum filtro.
        </EmptyState>
      ) : (
        <>
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Satisfação média" value={`${fmt1(stats.average)} de 5`} />
            <Stat label="Dentro do padrão habitual" value={stats.insidePct === null ? 'Sem dados' : `${stats.insidePct}%`} detail={`${stats.knownCount} clientes souberam avaliar`} />
            <Stat label="Avaliações" value={stats.count} detail={active ? 'com os filtros atuais' : 'no total'} />
            <Stat label="Mais observações" value={<span className="text-2xl">{top && top.count > 0 ? top.dish.name : 'Nenhum prato'}</span>} detail={top && top.count > 0 ? `${top.count} ${top.count === 1 ? 'observação' : 'observações'}` : undefined} />
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <Card className="p-4 sm:p-5">
                <h2 className="text-xl font-semibold">Dentro do padrão, por prato</h2>
                <p className="mb-4 mt-1 text-sm text-muted">Percentual entre clientes que souberam avaliar.</p>
                <ul className="flex flex-col gap-3.5">
                  {byDish.map(({ dish, stats: s }) => (
                    <li key={dish.id} title={`${dish.name}: ${s.insidePct ?? 'sem'}% em ${s.knownCount} respostas`}>
                      <p className="mb-1 flex justify-between gap-2 text-sm"><span className="text-body">{dish.name}</span><span className="tabular-nums text-cream">{s.insidePct === null ? 'Sem dados' : `${s.insidePct}%`}</span></p>
                      <div className="h-2 rounded-full bg-cream/10"><div className="h-full rounded-full bg-cream transition-[width] duration-500" style={{ width: `${s.insidePct ?? 0}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </Card>
              {top && top.count > 0 && (
                <Card className="p-4 sm:p-5">
                  <p className="eyebrow">Ponto de atenção</p>
                  <h2 className="mt-1 text-xl font-semibold">{top.dish.name}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">Feedback indica percepção, não a causa. Vale conversar com a cozinha e rever os momentos críticos antes de qualquer conclusão.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to={`/videos/${top.dish.id}`} className={btnClass('secondary', true)}>Rever preparo</Link>
                    <Link to="/avaliacao" className={btnClass('secondary', true)}>Avaliação interna</Link>
                  </div>
                </Card>
              )}
            </div>

            <section aria-label="Comentários" className="min-w-0">
              <ul className="flex flex-col gap-3">
                {list.map((x) => (
                  <li key={x.id}>
                    <Card className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-cream">{dishById(db, x.dishId)?.name}</p>
                        <p className="flex items-center gap-1 text-sm tabular-nums text-cream" aria-label={`Nota ${x.rating} de 5`}><Star size={15} className="fill-orange text-orange" aria-hidden />{x.rating}<span className="ml-2 text-muted">{fmtDate(x.date)}</span></p>
                      </div>
                      {x.comment ? <p className="mt-1.5 leading-relaxed">{x.comment}</p> : <p className="mt-1.5 text-muted">Sem comentário.</p>}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <Badge tone={x.expected === 'nao' ? 'warn' : x.expected === 'sim' ? 'ok' : 'neutral'}>{EXPECT_LABEL[x.expected]}</Badge>
                        <Badge>{x.attention}</Badge>
                        <Badge>{TYPE_LABEL[x.type]}</Badge>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
      {adding && <FeedbackForm onClose={() => setAdding(false)} />}
    </div>
  );
};
