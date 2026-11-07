import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Ban, BookOpenText, ChefHat, Clapperboard, Columns3, Crosshair, Eye, Flag, Hand, Lock, ShieldCheck, Sparkles, Wand2, type LucideIcon } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { MASTER } from '../data/seed';
import { approvedCount, dishById, dishStatus } from '../lib/metrics';
import { fmtDate, fmtTime, today } from '../lib/format';
import { DishArt } from '../components/DishArt';
import { VideoPlayer } from '../components/VideoPlayer';
import { ComparePanel } from '../components/ComparePanel';
import { ValidationPanel } from '../components/ValidationPanel';
import { Badge, Button, EmptyState, Note, StatusBadge, Tabs, btnClass, useToast } from '../components/ui';
import type { Recording, Step } from '../types';

type Tab = 'etapas' | 'comparar' | 'validar';

const Advice = ({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) => (
  <div className="rounded-xl border border-line bg-raised/50 p-3.5">
    <p className="flex items-center gap-2 text-sm font-semibold text-cream"><Icon size={17} className="text-orange" aria-hidden />{title}</p>
    <p className="mt-1.5 leading-relaxed text-body">{text}</p>
  </div>
);

const MasterNotes = ({ step, hidden }: { step: Step; hidden: boolean }) => {
  if (hidden) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-cream/20 p-6 text-center">
        <Lock size={22} className="text-cream/80" aria-hidden />
        <p className="font-semibold text-cream">Orientação em validação</p>
        <p className="text-sm text-muted">{step.title} ainda não foi aprovada pelo mestre. Quando for, aparece aqui como referência.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {step.status !== 'aprovado' && (
        <Note tone="warn" icon={Flag}>
          {step.status === 'correcao' ? `Correção pedida: ${step.correction ?? 'veja a aba Validação.'}` : 'Conteúdo registrado, ainda não aprovado. Aprendizes não veem este texto.'}
        </Note>
      )}
      <Advice icon={Eye} title="O que observar" text={step.observar} />
      <Advice icon={Hand} title="O que fazer" text={step.fazer} />
      <Advice icon={Ban} title="O que evitar" text={step.evitar} />
      {step.fala && <blockquote className="px-1 pt-1 font-display text-lg italic leading-snug text-cream">“{step.fala}”<footer className="mt-1 font-sans text-sm not-italic text-muted">{MASTER}</footer></blockquote>}
    </div>
  );
};

const Ribbon = ({ steps, rec, total, selected, onPick, time }: { steps: Step[]; rec: Recording; total: number; selected: string; onPick: (id: string) => void; time: number | null }) => (
  <div className="relative flex h-3 w-full gap-0.5" aria-hidden>
    {steps.map((s) => {
      const t = rec.times[s.id];
      const w = t ? ((t[1] - t[0]) / total) * 100 : 100 / steps.length;
      return (
        <button key={s.id} type="button" tabIndex={-1} onClick={() => onPick(s.id)} title={s.title} style={{ flexGrow: w, flexBasis: 0 }}
          className={`h-full rounded-sm transition-colors ${s.id === selected ? 'bg-cream' : s.critical ? 'bg-orange/70 hover:bg-orange' : 'bg-cream/20 hover:bg-cream/40'}`} />
      );
    })}
    {time !== null && <span className="pointer-events-none absolute -top-0.5 h-4 w-0.5 bg-magenta" style={{ left: `${Math.min(100, (time / total) * 100)}%` }} />}
  </div>
);

export const VideoDetail = () => {
  const { dishId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { db, user, can, update } = useApp();
  const toast = useToast();
  const dish = dishById(db, dishId);
  const recs = useMemo(() => db.recordings.filter((r) => r.dishId === dishId), [db.recordings, dishId]);

  const [tab, setTab] = useState<Tab>('etapas');
  const [recId, setRecId] = useState(recs[0]?.id ?? '');
  const [stepId, setStepId] = useState(params.get('etapa') ?? dish?.steps[0]?.id ?? '');
  const [seek, setSeek] = useState<{ t: number | null; nonce: number }>({ t: null, nonce: 0 });
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoTime, setVideoTime] = useState<number | null>(null);
  const timeRef = useRef(0);

  const rec = recs.find((r) => r.id === recId) ?? recs[0];
  const step = dish?.steps.find((s) => s.id === stepId) ?? dish?.steps[0];
  const isLearner = user?.role === 'aprendiz';

  const remember = useCallback((sid: string) => {
    if (!user) return;
    update((d) => ({ ...d, lastSeen: { ...d.lastSeen, [user.id]: { dishId, stepId: sid, at: today() } } }));
  }, [user, dishId, update]);

  useEffect(() => { if (step) remember(step.id); }, [step?.id, remember]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const e = params.get('etapa');
    if (e && e !== stepId) setStepId(e);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTime = useCallback((t: number) => { timeRef.current = t; setVideoTime(t); }, []);
  const onDuration = useCallback((d: number | null) => { setVideoDuration(d); if (d === null) setVideoTime(null); }, []);

  if (!dish || !step) {
    return <EmptyState icon={Clapperboard} title="Prato não encontrado" action={<Link to="/videos" className={btnClass()}>Ver preparos</Link>}>Escolha um dos preparos cadastrados.</EmptyState>;
  }

  const st = dishStatus(dish);
  const total = rec ? (videoDuration ?? rec.duration ?? 1) : 1;
  const times = rec?.times[step.id];
  const hasVideo = videoDuration !== null;
  const outOfRange = hasVideo && rec ? Object.values(rec.times).some(([a]) => a > videoDuration) || Object.keys(rec.times).length < dish.steps.length : false;

  const pickStep = (id: string) => {
    setStepId(id);
    if (params.get('etapa')) setParams({}, { replace: true });
    const t = rec?.times[id];
    if (t) setSeek((s) => ({ t: t[0], nonce: s.nonce + 1 }));
  };

  const patchRec = (patch: Partial<Recording>) =>
    update((d) => ({ ...d, recordings: d.recordings.map((r) => (r.id === rec?.id ? { ...r, ...patch } : r)) }));

  const fitTimes = () => {
    if (!rec || videoDuration === null) return;
    const old = rec.duration ?? 0;
    const hasAll = Object.keys(rec.times).length === dish.steps.length && old > 0;
    const k = videoDuration / (old || 1);
    const n = dish.steps.length;
    const next = Object.fromEntries(dish.steps.map((s, i) => {
      const t = rec.times[s.id];
      const pair: [number, number] = hasAll && t ? [t[0] * k, t[1] * k] : [(videoDuration * i) / n, (videoDuration * (i + 1)) / n];
      return [s.id, pair];
    }));
    patchRec({ times: next, duration: videoDuration });
    toast('Marcações ajustadas à duração do vídeo. Confira cada etapa.');
  };

  const markStart = () => {
    if (!rec || videoDuration === null) return;
    const cur = timeRef.current;
    const end = times && times[1] > cur ? times[1] : videoDuration;
    patchRec({ times: { ...rec.times, [step.id]: [cur, end] }, duration: videoDuration });
    toast(`${step.title} agora começa em ${fmtTime(cur)}.`);
  };

  const tabs = [
    { id: 'etapas' as Tab, label: 'Vídeo Destrinchado', icon: Clapperboard },
    ...(can.validate ? [
      { id: 'comparar' as Tab, label: 'Comparar Preparos', icon: Columns3 },
      { id: 'validar' as Tab, label: 'Validação', icon: ShieldCheck },
    ] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <DishArt kind={dish.art} label={dish.name} className="h-28 w-full shrink-0 rounded-xl2 sm:h-28 sm:w-44" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Vídeo Destrinchado</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{dish.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge icon={ChefHat}>Conhecimento de {MASTER}</Badge>
            <Badge>{dish.steps.length} etapas</Badge>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
        </div>
        <Link to={`/fichas/${dish.id}`} className={`${btnClass('secondary')} shrink-0`}><BookOpenText size={18} aria-hidden />Ficha técnica</Link>
      </header>

      {tabs.length > 1 && <Tabs label="Seções do preparo" value={tab} onChange={setTab} items={tabs} />}

      {tab === 'etapas' && (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              {recs.length > 1 && (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Gravação exibida">
                  {recs.map((r) => (
                    <button key={r.id} type="button" role="radio" aria-checked={r.id === rec?.id} onClick={() => setRecId(r.id)}
                      className={`min-h-[40px] rounded-lg border px-3 text-sm font-semibold transition-colors ${r.id === rec?.id ? 'border-cream/70 bg-cream/10 text-cream' : 'border-line text-muted hover:text-cream'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {rec ? (
                <>
                  <VideoPlayer recording={rec} step={step} canManage={can.edit} seek={seek} onTime={onTime} onDuration={onDuration} />
                  <div className="flex flex-col gap-1.5">
                    <Ribbon steps={dish.steps} rec={rec} total={total} selected={step.id} onPick={pickStep} time={hasVideo ? videoTime : null} />
                    <p className="flex flex-wrap justify-between gap-x-4 text-sm text-muted">
                      <span>{rec.occasion} · {fmtDate(rec.date)} · Gravação com consentimento</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-orange/80" aria-hidden />Momento crítico</span>
                    </p>
                  </div>
                  {hasVideo && can.edit && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" small icon={Crosshair} onClick={markStart}>Marcar início da etapa aqui</Button>
                      {outOfRange && <Button variant="secondary" small icon={Wand2} onClick={fitTimes}>Ajustar marcações a este vídeo</Button>}
                    </div>
                  )}
                  {outOfRange && <Note tone="warn">As marcações desta gravação não combinam com a duração do vídeo carregado. Ajuste antes de usar a seleção por etapa.</Note>}
                </>
              ) : <EmptyState icon={Clapperboard} title="Nenhuma gravação registrada">Cadastre a primeira gravação em Comparar Preparos.</EmptyState>}
            </div>

            <aside className="flex min-w-0 flex-col gap-3" aria-label="Comentários do mestre">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="eyebrow">Comentários do mestre</p>
                  <h2 className="mt-0.5 text-xl font-semibold">{step.title}</h2>
                </div>
                {!isLearner && <StatusBadge status={step.status} />}
              </div>
              <MasterNotes step={step} hidden={isLearner && step.status !== 'aprovado'} />
            </aside>
          </div>

          <section aria-label="Etapas do preparo">
            <h2 className="mb-3 text-2xl font-semibold">Momentos do preparo</h2>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dish.steps.map((s, i) => {
                const t = rec?.times[s.id];
                const active = s.id === step.id;
                const locked = isLearner && s.status !== 'aprovado';
                return (
                  <li key={s.id}>
                    <button type="button" aria-pressed={active} onClick={() => pickStep(s.id)}
                      className={`flex h-full w-full flex-col gap-1.5 rounded-xl2 border p-4 text-left transition-colors ${active ? 'border-cream/70 bg-cream/[0.08]' : 'border-line bg-surface hover:border-cream/30'}`}>
                      <span className="flex items-center justify-between gap-2 text-sm tabular-nums text-muted">
                        <span>Etapa {i + 1}</span>
                        <span>{t ? `${fmtTime(t[0])} a ${fmtTime(t[1])}` : 'Sem marcação'}</span>
                      </span>
                      <span className="font-display text-lg font-semibold leading-snug text-cream">{s.title}</span>
                      <span className="text-sm leading-relaxed text-muted">{locked ? 'Em validação pelo mestre.' : s.description}</span>
                      <span className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
                        {s.critical && <Badge tone="warn" icon={Sparkles}>Momento crítico</Badge>}
                        {!isLearner && s.status !== 'aprovado' && <StatusBadge status={s.status} />}
                        {locked && <Badge icon={Lock}>Em validação</Badge>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          <Note>Assista e consulte fora da área de manipulação, antes ou depois do preparo. Celular pessoal não entra na bancada. A aprendizagem se confirma na prática, com o mestre, em Avaliação Interna.</Note>
        </>
      )}

      {tab === 'comparar' && <ComparePanel dish={dish} recordings={recs} />}
      {tab === 'validar' && <ValidationPanel dish={dish} />}

      {isLearner && approvedCount(dish) < dish.steps.length && (
        <p className="text-sm text-muted">Você vê como referência apenas o que o mestre já aprovou.</p>
      )}

    </div>
  );
};
