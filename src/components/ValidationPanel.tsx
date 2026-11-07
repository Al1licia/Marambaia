import { useState } from 'react';
import { Check, History, MessageSquarePlus, Pencil, Undo2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { fmtDate, today, uid } from '../lib/format';
import { approvedCount } from '../lib/metrics';
import type { ContentStatus, DB, Dish, Step } from '../types';
import { Button, Card, Field, Modal, Note, ProgressBar, StatusBadge, useToast } from './ui';

type Dialog = { kind: 'correcao' | 'nota' | 'editar'; step: Step } | null;

export const ValidationPanel = ({ dish }: { dish: Dish }) => {
  const { db, user, update } = useApp();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [draft, setDraft] = useState({ observar: '', fazer: '', evitar: '' });
  const [error, setError] = useState('');

  const by = user?.name ?? '';
  const logs = db.logs.filter((l) => l.dishId === dish.id).sort((a, b) => b.at.localeCompare(a.at));
  const n = approvedCount(dish);

  const apply = (stepId: string, patch: Partial<Step>, entry: string) =>
    update((d: DB) => ({
      ...d,
      dishes: d.dishes.map((x) => (x.id === dish.id ? { ...x, steps: x.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) } : x)),
      logs: [{ id: uid('log'), dishId: dish.id, at: today(), by, text: entry }, ...d.logs],
    }));

  const open = (kind: 'correcao' | 'nota' | 'editar', step: Step) => {
    setDialog({ kind, step }); setText(''); setError('');
    setDraft({ observar: step.observar, fazer: step.fazer, evitar: step.evitar });
  };

  const confirm = () => {
    if (!dialog) return;
    const { kind, step } = dialog;
    if (kind === 'editar') {
      if (!draft.observar.trim() || !draft.fazer.trim() || !draft.evitar.trim()) { setError('Preencha as três orientações.'); return; }
      apply(step.id, { ...draft, status: 'revisao' as ContentStatus, correction: undefined }, `Orientações de ${step.title} editadas e enviadas para nova validação.`);
      toast('Orientação atualizada. Ela aguarda nova aprovação.');
    } else {
      if (!text.trim()) { setError('Escreva o que precisa ser registrado.'); return; }
      if (kind === 'correcao') {
        apply(step.id, { status: 'correcao', correction: text.trim() }, `Correção solicitada em ${step.title}: ${text.trim()}`);
        toast('Correção solicitada. A etapa saiu da referência dos aprendizes.');
      } else {
        apply(step.id, {}, `Observação em ${step.title}: ${text.trim()}`);
        toast('Observação adicionada ao histórico.');
      }
    }
    setDialog(null);
  };

  return (
    <section aria-label="Validação do conteúdo" className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Validação do conteúdo</h2>
          <p className="mt-1 text-muted">O registro só vira referência para a equipe depois da aprovação do mestre.</p>
        </div>
        <div>
          <p className="mb-1.5 text-sm tabular-nums text-muted">{n} de {dish.steps.length} etapas aprovadas</p>
          <ProgressBar value={Math.round((n / dish.steps.length) * 100)} label="Etapas aprovadas" />
        </div>
        {dish.steps.map((s, i) => (
          <Card key={s.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{i + 1}. {s.title}</h3>
              <StatusBadge status={s.status} />
            </div>
            {s.correction && <Note tone="warn">{s.correction}</Note>}
            <div className="flex flex-wrap gap-2">
              {s.status !== 'aprovado' && (
                <Button small icon={Check} onClick={() => { apply(s.id, { status: 'aprovado', correction: undefined }, `Orientações de ${s.title} aprovadas.`); toast(`${s.title} aprovada. Já aparece para os aprendizes.`); }}>Aprovar orientações</Button>
              )}
              <Button small variant="secondary" icon={Undo2} onClick={() => open('correcao', s)}>Solicitar correção</Button>
              <Button small variant="secondary" icon={Pencil} onClick={() => open('editar', s)}>Editar</Button>
              <Button small variant="ghost" icon={MessageSquarePlus} onClick={() => open('nota', s)}>Observação</Button>
            </div>
          </Card>
        ))}
      </div>

      <aside className="min-w-0">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold"><History size={18} className="text-orange" aria-hidden />Histórico de atualizações</h3>
        <ol className="flex flex-col gap-3 border-l border-line pl-4">
          {logs.map((l) => (
            <li key={l.id} className="text-sm leading-relaxed">
              <p className="text-body">{l.text}</p>
              <p className="text-muted">{l.by} · {fmtDate(l.at)}</p>
            </li>
          ))}
          {logs.length === 0 && <li className="text-sm text-muted">Sem atualizações registradas.</li>}
        </ol>
      </aside>

      {dialog && (
        <Modal title={dialog.kind === 'correcao' ? 'Solicitar correção' : dialog.kind === 'nota' ? 'Acrescentar observação' : 'Editar orientações'} onClose={() => setDialog(null)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">{dialog.step.title}</p>
            {dialog.kind === 'editar' ? (
              (['observar', 'fazer', 'evitar'] as const).map((k) => (
                <Field key={k} label={`O que ${k}`} htmlFor={`ed-${k}`}>
                  <textarea id={`ed-${k}`} rows={2} className="field" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
                </Field>
              ))
            ) : (
              <Field label={dialog.kind === 'correcao' ? 'O que precisa mudar?' : 'Observação'} htmlFor="val-text">
                <textarea id="val-text" rows={3} className="field" value={text} onChange={(e) => setText(e.target.value)} />
              </Field>
            )}
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button><Button onClick={confirm}>Salvar</Button></div>
          </div>
        </Modal>
      )}
    </section>
  );
};
