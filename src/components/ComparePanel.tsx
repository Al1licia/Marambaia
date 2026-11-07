import { useEffect, useState, type FormEvent } from 'react';
import { CheckCheck, CircleHelp, Columns3, GitCompareArrows, Pencil, Plus, Save, type LucideIcon } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { fmtDate, fmtTime, today, uid } from '../lib/format';
import type { CompareMarkKind, Dish, Recording, RecordingCell, Step } from '../types';
import { Button, Card, EmptyState, Field, Modal, Note, useToast } from './ui';

const MARKS: { id: CompareMarkKind; label: string; icon: LucideIcon; on: string }[] = [
  { id: 'consistente', label: 'Etapa consistente', icon: CheckCheck, on: 'border-cream/70 bg-cream/15 text-cream' },
  { id: 'divergencia', label: 'Divergência observada', icon: GitCompareArrows, on: 'border-orange bg-orange/15 text-orange' },
  { id: 'validar', label: 'Necessita validação', icon: CircleHelp, on: 'border-pink bg-magenta/20 text-pink' },
];

const NewRecording = ({ dish, count, onClose }: { dish: Dish; count: number; onClose: () => void }) => {
  const { update, user } = useApp();
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [occasion, setOccasion] = useState('');
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!occasion.trim() || !consent) return;
    const label = `Gravação ${count + 1}`;
    update((d) => ({
      ...d,
      recordings: [...d.recordings, { id: uid('rec'), dishId: dish.id, label, date, occasion: occasion.trim(), recordedBy: user?.name ?? '', consent, duration: null, times: {}, cells: {}, result: '' }],
      logs: [{ id: uid('log'), dishId: dish.id, at: today(), by: user?.name ?? '', text: `${label} registrada com consentimento.` }, ...d.logs],
    }));
    toast(`${label} cadastrada. O registro original fica preservado.`);
    onClose();
  };

  return (
    <Modal title="Cadastrar nova gravação" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Data da gravação" htmlFor="rec-date"><input id="rec-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Ocasião" htmlFor="rec-occ" error={tried && !occasion.trim() ? 'Descreva quando foi gravado.' : undefined} hint="Ajuda a entender diferenças. Exemplo: sábado de casa cheia.">
          <input id="rec-occ" className="field" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
        </Field>
        <label className="flex min-h-[48px] items-start gap-3 rounded-xl border border-line p-3 text-sm">
          <input type="checkbox" className="range mt-0.5 h-5 w-5 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Quem aparece no vídeo autorizou a gravação, e ela foi feita sem comprometer a higiene da cozinha.</span>
        </label>
        {tried && !consent && <p role="alert" className="text-sm text-danger">Sem consentimento a gravação não pode ser cadastrada.</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" icon={Plus}>Cadastrar</Button></div>
      </form>
    </Modal>
  );
};

const Cell = ({ rec, step, canEdit }: { rec: Recording; step: Step; canEdit: boolean }) => {
  const { update } = useApp();
  const cell: RecordingCell | undefined = rec.cells[step.id];
  const t = rec.times[step.id];
  const [edit, setEdit] = useState(false);
  const [gesto, setGesto] = useState(cell?.gesto ?? '');
  const [criterio, setCriterio] = useState(cell?.criterio ?? '');

  const save = () => {
    update((d) => ({ ...d, recordings: d.recordings.map((r) => (r.id === rec.id ? { ...r, cells: { ...r.cells, [step.id]: { gesto: gesto.trim(), criterio: criterio.trim() } } } : r)) }));
    setEdit(false);
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-raised/50 p-3">
      <p className="flex items-center justify-between gap-2 text-sm"><span className="font-semibold text-cream">{rec.label}</span><span className="tabular-nums text-muted">{t ? `início ${fmtTime(t[0])}` : 'sem marcação'}</span></p>
      {edit ? (
        <>
          <textarea aria-label={`Gesto em ${rec.label}`} className="field text-sm" rows={2} placeholder="Gesto observado" value={gesto} onChange={(e) => setGesto(e.target.value)} />
          <textarea aria-label={`Critério em ${rec.label}`} className="field text-sm" rows={2} placeholder="Critério utilizado" value={criterio} onChange={(e) => setCriterio(e.target.value)} />
          <div className="flex justify-end gap-1"><Button variant="ghost" small onClick={() => setEdit(false)}>Cancelar</Button><Button small icon={Save} onClick={save}>Salvar</Button></div>
        </>
      ) : (
        <>
          {cell ? (
            <dl className="flex flex-col gap-1.5 text-sm leading-relaxed">
              <div><dt className="text-muted">Gesto</dt><dd className="text-body">{cell.gesto || 'Sem registro'}</dd></div>
              <div><dt className="text-muted">Critério</dt><dd className="text-body">{cell.criterio || 'Sem registro'}</dd></div>
            </dl>
          ) : <p className="text-sm text-muted">Ainda sem observações registradas.</p>}
          {canEdit && <button type="button" onClick={() => setEdit(true)} className="mt-auto inline-flex min-h-[36px] items-center gap-1.5 self-start text-sm font-semibold text-cream/80 hover:text-cream"><Pencil size={14} aria-hidden />{cell ? 'Editar' : 'Registrar'}</button>}
        </>
      )}
    </div>
  );
};

const StepRow = ({ dish, step, index, shown }: { dish: Dish; step: Step; index: number; shown: Recording[] }) => {
  const { db, user, update, can } = useApp();
  const toast = useToast();
  const key = `${dish.id}:${step.id}`;
  const mark = db.marks[key];
  const [note, setNote] = useState(mark?.note ?? '');
  useEffect(() => setNote(mark?.note ?? ''), [mark?.note]);

  const saveMark = (patch: { kind?: CompareMarkKind; note?: string }) =>
    update((d) => ({ ...d, marks: { ...d.marks, [key]: { kind: d.marks[key]?.kind, note: d.marks[key]?.note ?? '', ...patch, by: user?.name ?? '', at: today() } } }));

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-sm text-muted">Etapa {index + 1}</span>
        <h3 className="text-lg font-semibold">{step.title}</h3>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 210px), 1fr))` }}>
        {shown.map((r) => <Cell key={r.id} rec={r} step={step} canEdit={can.edit} />)}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Marcação da etapa ${step.title}`}>
        {MARKS.map(({ id, label, icon: Icon, on }) => (
          <button key={id} type="button" role="radio" aria-checked={mark?.kind === id}
            onClick={() => { saveMark({ kind: mark?.kind === id ? undefined : id }); toast(mark?.kind === id ? 'Marcação removida.' : `${step.title}: ${label.toLowerCase()}.`); }}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${mark?.kind === id ? on : 'border-line text-muted hover:text-cream'}`}>
            <Icon size={16} aria-hidden />{label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input aria-label={`Observação do responsável sobre ${step.title}`} className="field flex-1" placeholder="Observação do responsável" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button variant="secondary" icon={Save} disabled={note === (mark?.note ?? '')} onClick={() => { saveMark({ note: note.trim() }); toast('Observação salva.'); }}>Salvar</Button>
      </div>
      {mark?.note && mark.by && <p className="text-sm text-muted">Registrado por {mark.by} em {fmtDate(mark.at)}</p>}
    </Card>
  );
};

export const ComparePanel = ({ dish, recordings }: { dish: Dish; recordings: Recording[] }) => {
  const [selected, setSelected] = useState<string[]>(recordings.slice(0, 3).map((r) => r.id));
  const [adding, setAdding] = useState(false);
  const shown = recordings.filter((r) => selected.includes(r.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? [...s.slice(1), id] : [...s, id]));

  return (
    <section aria-label="Comparar Preparos" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Comparar Preparos</h2>
          <p className="mt-1 text-muted">Veja lado a lado o que muda entre ocasiões diferentes: sequência, gestos, critérios e resultado.</p>
        </div>
        <Button variant="secondary" icon={Plus} onClick={() => setAdding(true)}>Nova gravação</Button>
      </div>

      <Note>
        A comparação mostra diferenças e não aponta a receita verdadeira. Uma gravação parecida com as outras não vale mais por isso, e uma diferença não indica má-fé: o dia, o movimento e o ingrediente mudam o preparo. Quem decide é o responsável, pelo resultado culinário. Todas as gravações têm consentimento, e os originais ficam preservados.
      </Note>

      {recordings.length < 2 ? (
        <EmptyState icon={Columns3} title="Ainda não há o que comparar" action={<Button icon={Plus} onClick={() => setAdding(true)}>Cadastrar gravação</Button>}>
          {dish.name} tem {recordings.length} gravação. Registre o preparo em outra ocasião para comparar. A feijoada traz um exemplo completo com três gravações.
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Gravações comparadas">
            {recordings.map((r) => (
              <button key={r.id} type="button" aria-pressed={selected.includes(r.id)} onClick={() => toggle(r.id)}
                className={`min-h-[56px] rounded-xl border px-3.5 py-1.5 text-left transition-colors ${selected.includes(r.id) ? 'border-cream/70 bg-cream/10' : 'border-line opacity-70 hover:opacity-100'}`}>
                <span className="block text-sm font-semibold text-cream">{r.label}</span>
                <span className="block text-sm text-muted">{r.occasion} · {fmtDate(r.date)}</span>
              </button>
            ))}
          </div>
          {shown.length < 2 && <Note tone="warn">Selecione ao menos duas gravações para comparar lado a lado.</Note>}
          {shown.length > 0 && dish.steps.map((s, i) => <StepRow key={s.id} dish={dish} step={s} index={i} shown={shown} />)}
          {shown.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-3 text-lg font-semibold">Resultado final registrado</h3>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))' }}>
                {shown.map((r) => (
                  <div key={r.id} className="rounded-xl bg-raised/50 p-3 text-sm leading-relaxed">
                    <p className="mb-1 font-semibold text-cream">{r.label}</p>
                    <p>{r.result || 'Resultado ainda não registrado.'}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
      {adding && <NewRecording dish={dish} count={recordings.length} onClose={() => setAdding(false)} />}
    </section>
  );
};
