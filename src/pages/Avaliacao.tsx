import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Lock, Plus, Settings2, TrendingUp, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { RESULT_LABEL, dishById, evalAverage, evalsOf, habilitationChecks, progressOf, validatedSteps } from '../lib/metrics';
import { avg, fmt1, fmtDate, today, uid } from '../lib/format';
import { Button, Card, Field, Modal, Note, ProgressBar, ScorePicker, Tabs, btnClass, useToast } from '../components/ui';
import type { Criterion, EvalResult, Evaluation, Supervision } from '../types';

export const ProgressTabs = ({ current }: { current: 'progresso' | 'avaliacao' }) => {
  const { can } = useApp();
  const [to, setTo] = useState<string | null>(null);
  if (to) return <Navigate to={to} />;
  if (!can.evaluate) return null;
  return (
    <Tabs label="Progresso e Avaliação Interna" value={current} onChange={(v) => v !== current && setTo(`/${v}`)}
      items={[{ id: 'progresso', label: 'Progresso', icon: TrendingUp }, { id: 'avaliacao', label: 'Avaliação Interna', icon: ClipboardCheck }]} />
  );
};

const CriteriaEditor = ({ dishId, onClose }: { dishId: string; onClose: () => void }) => {
  const { db, update } = useApp();
  const toast = useToast();
  const [list, setList] = useState<Criterion[]>(db.criteria[dishId]);
  const [label, setLabel] = useState('');
  const [expected, setExpected] = useState('');

  const save = () => {
    update((d) => ({ ...d, criteria: { ...d.criteria, [dishId]: list } }));
    toast('Critérios deste prato atualizados.');
    onClose();
  };
  return (
    <Modal title={`Critérios de ${dishById(db, dishId)?.name}`} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">Cada prato tem o seu padrão. Ative, desative ou acrescente critérios.</p>
        {list.map((c) => (
          <label key={c.id} className="flex min-h-[48px] items-start gap-3 rounded-xl border border-line p-3">
            <input type="checkbox" className="range mt-0.5 h-5 w-5 shrink-0" checked={c.active} onChange={(e) => setList(list.map((x) => (x.id === c.id ? { ...x, active: e.target.checked } : x)))} />
            <span><span className="block font-semibold text-cream">{c.label}</span><span className="text-sm text-muted">{c.expected}</span></span>
          </label>
        ))}
        <div className="grid gap-2 rounded-xl bg-raised/50 p-3">
          <input aria-label="Novo critério" className="field" placeholder="Novo critério" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input aria-label="Característica esperada" className="field" placeholder="Característica esperada" value={expected} onChange={(e) => setExpected(e.target.value)} />
          <Button small variant="secondary" icon={Plus} disabled={!label.trim() || !expected.trim()} onClick={() => { setList([...list, { id: uid('c'), label: label.trim(), expected: expected.trim(), active: true }]); setLabel(''); setExpected(''); }}>Adicionar critério</Button>
        </div>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save}>Salvar critérios</Button></div>
      </div>
    </Modal>
  );
};

const Pips = ({ value, label }: { value: number; label: string }) => (
  <span role="img" aria-label={`${label}: ${value || 'sem nota'} de 5`} className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-2 w-5 rounded-sm ${n <= value ? 'bg-cream' : 'bg-cream/15'}`} />)}
  </span>
);

const HouseStandard = ({ criteria, scores, previous, history }: { criteria: Criterion[]; scores: Record<string, number>; previous?: Evaluation; history: Evaluation[] }) => {
  const gaps = criteria.filter((c) => scores[c.id] > 0 && scores[c.id] < 4);
  return (
    <Card className="flex flex-col gap-4 p-4 sm:p-5">
      <div>
        <h2 className="text-xl font-semibold">Comparar com o Padrão da Casa</h2>
        <p className="mt-1 text-sm text-muted">Nota 5 significa igual ao padrão. Apoia a decisão de quem provou: o julgamento é humano.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {criteria.map((c) => (
          <li key={c.id}>
            <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-cream">{c.label}<Pips value={scores[c.id] ?? 0} label={c.label} /></p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">{c.expected}</p>
            {previous?.scores[c.id] !== undefined && <p className="text-xs tabular-nums text-muted">Avaliação anterior: {previous.scores[c.id]}</p>}
          </li>
        ))}
      </ul>
      <div>
        <p className="mb-1 text-sm font-semibold text-cream">Diferenças identificadas</p>
        {Object.values(scores).filter(Boolean).length === 0 ? <p className="text-sm text-muted">Dê as notas para ver as diferenças.</p>
          : gaps.length === 0 ? <p className="text-sm text-muted">Nenhum critério abaixo de 4.</p>
            : <ul className="flex flex-col gap-1 text-sm">{gaps.map((c) => <li key={c.id}><span className="text-orange">{c.label} ({scores[c.id]})</span> abaixo do esperado.</li>)}</ul>}
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-cream">Avaliações anteriores</p>
        {history.length === 0 ? <p className="text-sm text-muted">Primeira avaliação deste prato.</p> : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {history.slice(0, 4).map((e) => (
              <li key={e.id} className="flex justify-between gap-3"><span className="text-muted">{fmtDate(e.date)} · {RESULT_LABEL[e.result]}</span><span className="tabular-nums text-cream">{fmt1(evalAverage(e))}</span></li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
};

interface Saved { employeeId: string; name: string; dishId: string; dishName: string; before: number; after: number; beforeDone: number; afterDone: number; total: number; result: EvalResult }

const Success = ({ s, onNew }: { s: Saved; onNew: () => void }) => {
  const [pct, setPct] = useState(s.before);
  useEffect(() => { const t = setTimeout(() => setPct(s.after), 250); return () => clearTimeout(t); }, [s.after]);
  const moved = s.afterDone > s.beforeDone;
  return (
    <Card className="mx-auto flex w-full max-w-xl animate-rise flex-col gap-4 p-5 sm:p-7">
      <CheckCircle2 size={34} className="text-orange" aria-hidden />
      <div>
        <h2 className="text-2xl font-semibold">Avaliação registrada</h2>
        <p className="mt-1 text-muted">{s.name} · {s.dishName} · {RESULT_LABEL[s.result]}</p>
      </div>
      <div>
        <p className="mb-2 flex justify-between gap-2 text-sm"><span className="font-semibold text-cream">{moved ? 'Progresso atualizado' : 'Progresso mantido'}</span><span className="tabular-nums text-cream">{s.afterDone} de {s.total} etapas validadas</span></p>
        <ProgressBar value={pct} label="Progresso atualizado" />
        <p className="mt-2 text-sm tabular-nums text-muted">{moved ? `Antes: ${s.beforeDone} de ${s.total} (${s.before}%). Agora: ${s.after}%.` : 'Nenhuma etapa nova foi validada nesta prática.'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/progresso" state={{ updated: s.employeeId }} className={btnClass()}>Ver progresso da equipe <ArrowRight size={18} aria-hidden /></Link>
        <Button variant="secondary" onClick={onNew}>Nova avaliação</Button>
      </div>
    </Card>
  );
};

export const Avaliacao = () => {
  const { db, user, can, update } = useApp();
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState(db.employees[0].id);
  const [dishId, setDishId] = useState(db.employees[0].learning[0]);
  const [date, setDate] = useState(today());
  const [batch, setBatch] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [sequencia, setSequencia] = useState(0);
  const [momentos, setMomentos] = useState(0);
  const [higiene, setHigiene] = useState(0);
  const [supervisao, setSupervisao] = useState<Supervision | ''>('');
  const [result, setResult] = useState<EvalResult | ''>('');
  const [steps, setSteps] = useState<string[]>([]);
  const [obs, setObs] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [tried, setTried] = useState(false);
  const [editCriteria, setEditCriteria] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);

  const dish = dishById(db, dishId);
  const criteria = useMemo(() => db.criteria[dishId].filter((c) => c.active), [db.criteria, dishId]);
  const known = useMemo(() => validatedSteps(db, employeeId, dishId), [db, employeeId, dishId]);
  const history = useMemo(() => evalsOf(db, employeeId, dishId), [db, employeeId, dishId]);
  const employee = db.employees.find((e) => e.id === employeeId)!;

  useEffect(() => { setSteps([]); setResult(''); setConfirmed(false); }, [employeeId, dishId]);

  if (!can.evaluate) {
    return user?.employeeId ? <Navigate to={`/progresso/${user.employeeId}`} replace /> : <Navigate to="/inicio" replace />;
  }

  const clear = () => {
    setSaved(null); setBatch(''); setScores({}); setSequencia(0); setMomentos(0); setHigiene(0);
    setSupervisao(''); setResult(''); setSteps([]); setObs(''); setConfirmed(false); setTried(false);
  };

  if (saved) return <div className="flex flex-col gap-6"><ProgressTabs current="avaliacao" /><Success s={saved} onNew={clear} /></div>;

  const sensoryAvg = avg(criteria.map((c) => scores[c.id] ?? 0));
  const checks = habilitationChecks(db, employeeId, dishId, { steps, average: sensoryAvg, higiene, supervisao });
  const canHabilitate = checks.every((c) => c.ok);
  const credits = result === 'aprovado' || result === 'habilitado';
  const lowHygiene = higiene > 0 && higiene < 3;

  const missing = {
    batch: !batch.trim(),
    scores: criteria.some((c) => !scores[c.id]),
    process: !sequencia || !momentos || !higiene || !supervisao,
    result: !result,
    steps: result === 'aprovado' && steps.length === 0,
    hygiene: credits && lowHygiene,
    confirm: result === 'habilitado' && (!confirmed || !canHabilitate),
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.values(missing).some(Boolean) || !result || !supervisao) {
      toast('Faltam informações para registrar a avaliação.', 'error');
      return;
    }
    const before = progressOf(db, employeeId, dishId);
    const item: Evaluation = {
      id: uid('ev'), employeeId, dishId, date, evaluator: user?.name ?? '', batch: batch.trim(),
      scores: Object.fromEntries(criteria.map((c) => [c.id, scores[c.id]])),
      sequencia, momentos, higiene, supervisao, result, stepsApproved: credits ? steps : [], observacoes: obs.trim(),
    };
    const total = before.total;
    const afterDone = new Set([...known, ...item.stepsApproved]).size;
    update((d) => ({ ...d, evaluations: [...d.evaluations, item] }));
    setSaved({ employeeId, name: employee.name, dishId, dishName: dish?.name ?? '', before: before.pct, after: Math.round((afterDone / total) * 100), beforeDone: before.done, afterDone, total, result });
    window.scrollTo(0, 0);
  };

  const err = (bad: boolean, text: string) => (tried && bad ? text : undefined);

  return (
    <div className="flex flex-col gap-6">
      <ProgressTabs current="avaliacao" />
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Avaliação Interna</h1>
        <p className="mt-2 text-muted">Registre um prato feito de verdade: quem provou compara com o padrão aprovado pela casa. Aqui é a percepção da cozinha, diferente do feedback dos clientes.</p>
      </header>

      <form onSubmit={submit} noValidate className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <Field label="Funcionário" htmlFor="ev-emp">
              <select id="ev-emp" className="field" value={employeeId} onChange={(e) => { const id = e.target.value; setEmployeeId(id); setDishId(db.employees.find((x) => x.id === id)!.learning[0]); }}>
                {db.employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>
            <Field label="Prato executado" htmlFor="ev-dish">
              <select id="ev-dish" className="field" value={dishId} onChange={(e) => setDishId(e.target.value)}>
                {employee.learning.map((id) => <option key={id} value={id}>{dishById(db, id)?.name}</option>)}
              </select>
            </Field>
            <Field label="Data" htmlFor="ev-date"><input id="ev-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label="Avaliador" htmlFor="ev-by"><input id="ev-by" className="field opacity-80" value={user?.name ?? ''} readOnly /></Field>
            <div className="sm:col-span-2">
              <Field label="Preparação ou lote avaliado" htmlFor="ev-batch" error={err(missing.batch, 'Informe qual preparação foi avaliada.')} hint="Exemplo: almoço de quinta, panela 2.">
                <input id="ev-batch" className="field" value={batch} onChange={(e) => setBatch(e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Avaliação sensorial</h2>
              <Button small variant="ghost" icon={Settings2} onClick={() => setEditCriteria(true)}>Ajustar critérios</Button>
            </div>
            {criteria.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 flex-1 basis-44 font-medium text-body">{c.label}</p>
                <ScorePicker label={c.label} value={scores[c.id] ?? 0} error={tried && !scores[c.id]} onChange={(n) => setScores((s) => ({ ...s, [c.id]: n }))} />
              </div>
            ))}
            {tried && missing.scores && <p role="alert" className="text-sm text-danger">Dê uma nota para cada critério.</p>}
          </Card>

          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-xl font-semibold">Execução</h2>
            {([['Execução correta da sequência', sequencia, setSequencia], ['Reconhecimento dos momentos críticos', momentos, setMomentos], ['Segurança e higiene durante o preparo', higiene, setHigiene]] as const).map(([l, v, set]) => (
              <div key={l} className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 flex-1 basis-44 font-medium text-body">{l}</p>
                <ScorePicker label={l} value={v} error={tried && !v} onChange={set} />
              </div>
            ))}
            <div>
              <p className="mb-1.5 font-medium text-body">Necessidade de supervisão</p>
              <div role="radiogroup" aria-label="Necessidade de supervisão" className="grid gap-1.5 sm:grid-cols-3">
                {([['sem', 'Sem supervisão'], ['pontual', 'Pontual'], ['constante', 'Constante']] as [Supervision, string][]).map(([v, l]) => (
                  <button key={v} type="button" role="radio" aria-checked={supervisao === v} onClick={() => setSupervisao(v)}
                    className={`min-h-[48px] rounded-xl border px-2 font-semibold transition-colors ${supervisao === v ? 'border-brand bg-brand text-cream' : `${tried && !supervisao ? 'border-danger/60' : 'border-line'} text-muted hover:text-cream`}`}>{l}</button>
                ))}
              </div>
            </div>
            {tried && missing.process && <p role="alert" className="text-sm text-danger">Complete as notas de execução e a supervisão.</p>}
          </Card>

          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <h2 className="text-xl font-semibold">Resultado</h2>
            <div role="radiogroup" aria-label="Resultado" className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(RESULT_LABEL) as EvalResult[]).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={result === r} onClick={() => setResult(r)}
                  className={`min-h-[56px] rounded-xl border px-3 text-left font-semibold transition-colors ${result === r ? 'border-brand bg-brand text-cream' : `${tried && !result ? 'border-danger/60' : 'border-line'} text-body hover:border-cream/40`}`}>
                  {RESULT_LABEL[r]}
                </button>
              ))}
            </div>
            {tried && missing.result && <p role="alert" className="text-sm text-danger">Escolha um resultado.</p>}
            {credits && lowHygiene && <Note tone="warn">Com nota de higiene abaixo de 3, a casa não valida etapas. Registre como “Precisa de mais prática”.</Note>}

            {credits && dish && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 font-medium text-body">Etapas aprovadas nesta prática</legend>
                {dish.steps.map((s) => {
                  const done = known.has(s.id);
                  const notApproved = s.status !== 'aprovado';
                  const checked = done || steps.includes(s.id);
                  return (
                    <label key={s.id} className={`flex min-h-[48px] items-center gap-3 rounded-xl border border-line px-3 py-2 ${done || notApproved ? 'opacity-70' : 'cursor-pointer hover:border-cream/40'}`}>
                      <input type="checkbox" className="range h-5 w-5 shrink-0" checked={checked} disabled={done || notApproved}
                        onChange={(e) => setSteps(e.target.checked ? [...steps, s.id] : steps.filter((x) => x !== s.id))} />
                      <span className="min-w-0"><span className="block text-body">{s.title}</span>
                        {done && <span className="block text-sm text-muted">Já validada em avaliação anterior</span>}
                        {!done && notApproved && <span className="block text-sm text-muted">Aguarda aprovação da orientação pelo mestre</span>}
                      </span>
                    </label>
                  );
                })}
                {tried && missing.steps && <p role="alert" className="text-sm text-danger">Marque ao menos uma etapa aprovada.</p>}
              </fieldset>
            )}

            {result === 'habilitado' && (
              <div className="flex flex-col gap-2 rounded-xl bg-raised/50 p-3.5">
                <p className="font-semibold text-cream">Regras da casa para habilitação</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {checks.map((c) => (
                    <li key={c.label} className="flex items-start gap-2">
                      {c.ok ? <Check size={16} className="mt-0.5 shrink-0 text-cream" aria-label="Atendido" /> : <X size={16} className="mt-0.5 shrink-0 text-orange" aria-label="Pendente" />}
                      <span className={c.ok ? 'text-body' : 'text-muted'}>{c.label}</span>
                    </li>
                  ))}
                </ul>
                <label className={`mt-1 flex items-start gap-3 text-sm ${canHabilitate ? '' : 'opacity-60'}`}>
                  <input type="checkbox" className="range mt-0.5 h-5 w-5 shrink-0" disabled={!canHabilitate} checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  <span>Como responsável autorizado, confirmo que {employee.name} pode fazer o preparo completo.</span>
                </label>
                {!canHabilitate && <p className="flex items-center gap-1.5 text-sm text-orange"><Lock size={14} aria-hidden />Ainda não é possível habilitar. A nota de um dia não basta.</p>}
                {tried && canHabilitate && !confirmed && <p role="alert" className="text-sm text-danger">Confirme a habilitação para registrar.</p>}
              </div>
            )}

            <Field label="Observações do avaliador" htmlFor="ev-obs">
              <textarea id="ev-obs" rows={3} className="field" value={obs} onChange={(e) => setObs(e.target.value)} />
            </Field>
            <Button type="submit" icon={ClipboardCheck} className="w-full">Registrar avaliação</Button>
          </Card>
        </div>

        <div className="min-w-0 lg:sticky lg:top-20">
          <HouseStandard criteria={criteria} scores={scores} previous={history[0]} history={history} />
        </div>
      </form>
      {editCriteria && <CriteriaEditor dishId={dishId} onClose={() => setEditCriteria(false)} />}
    </div>
  );
};
