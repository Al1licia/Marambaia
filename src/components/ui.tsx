import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertTriangle, BadgeCheck, CheckCircle2, CircleDashed, Info, Loader2, X, type LucideIcon } from 'lucide-react';
import type { ContentStatus } from '../types';
import { initials } from '../lib/format';

type Variant = 'primary' | 'secondary' | 'ghost';
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  small?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-cream hover:bg-brand-hover',
  secondary: 'border border-cream/25 text-cream hover:border-cream/60 hover:bg-cream/5',
  ghost: 'text-body hover:bg-cream/5',
};

export const btnClass = (variant: Variant = 'primary', small = false) =>
  `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors active:translate-y-px
   disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0
   ${small ? 'min-h-[40px] px-3 text-sm' : 'min-h-[48px] px-5'} ${variants[variant]}`;

export const Button = ({ variant = 'primary', icon: Icon, loading, small, className = '', children, disabled, ...rest }: BtnProps) => (
  <button type="button" {...rest} disabled={disabled || loading} className={`${btnClass(variant, small)} ${className}`}>
    {loading ? <Loader2 size={18} className="animate-spin" aria-hidden /> : Icon && <Icon size={18} aria-hidden />}
    {children}
  </button>
);

export const Card = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-xl2 border border-line bg-surface ${className}`}>{children}</div>
);

type Tone = 'ok' | 'warn' | 'alert' | 'neutral';
const tones: Record<Tone, string> = {
  ok: 'border-cream/30 bg-cream/10 text-cream',
  warn: 'border-orange/40 bg-orange/10 text-orange',
  alert: 'border-pink/40 bg-magenta/15 text-pink',
  neutral: 'border-line bg-raised text-body',
};

export const Badge = ({ tone = 'neutral', icon: Icon, children }: { tone?: Tone; icon?: LucideIcon; children: ReactNode }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
    {Icon && <Icon size={13} aria-hidden />}
    {children}
  </span>
);

export const StatusBadge = ({ status }: { status: ContentStatus }) => {
  if (status === 'aprovado') return <Badge tone="ok" icon={BadgeCheck}>Aprovado</Badge>;
  if (status === 'correcao') return <Badge tone="alert" icon={AlertTriangle}>Correção pedida</Badge>;
  return <Badge tone="warn" icon={CircleDashed}>Aguardando validação</Badge>;
};

export const Avatar = ({ name, size = 44 }: { name: string; size?: number }) => (
  <span className="ring-mark inline-flex shrink-0 rounded-full p-[2px]" style={{ width: size, height: size }}>
    <span className="flex h-full w-full items-center justify-center rounded-full bg-raised font-semibold text-cream" style={{ fontSize: size * 0.34 }}>
      {initials(name)}
    </span>
  </span>
);

export const ProgressBar = ({ value, label }: { value: number; label: string }) => (
  <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2.5 w-full overflow-hidden rounded-full bg-cream/10">
    <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${value}%`, background: 'linear-gradient(90deg,#FF9E00,#E0247A 70%,#D300C5)' }} />
  </div>
);

export const Field = ({ label, htmlFor, error, hint, children }: { label: string; htmlFor?: string; error?: string; hint?: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-cream">{label}</label>
    {children}
    {hint && !error && <p className="text-sm text-muted">{hint}</p>}
    {error && <p role="alert" className="flex items-center gap-1.5 text-sm text-danger"><AlertTriangle size={14} aria-hidden />{error}</p>}
  </div>
);

export const Note = ({ icon: Icon = Info, tone = 'neutral', children, className = '' }: { icon?: LucideIcon; tone?: 'neutral' | 'warn'; children: ReactNode; className?: string }) => (
  <div className={`flex gap-3 rounded-xl border p-3.5 text-sm leading-relaxed ${tone === 'warn' ? 'border-orange/35 bg-orange/[0.07] text-body' : 'border-line bg-raised/50 text-muted'} ${className}`}>
    <Icon size={18} className={`mt-0.5 shrink-0 ${tone === 'warn' ? 'text-orange' : 'text-cream/70'}`} aria-hidden />
    <div className="min-w-0">{children}</div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-cream/20 px-6 py-12 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-raised text-cream"><Icon size={22} aria-hidden /></span>
    <h3 className="text-xl">{title}</h3>
    {children && <p className="max-w-md text-muted">{children}</p>}
    {action}
  </div>
);

export const Tabs = <T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; icon?: LucideIcon }[]; label: string }) => (
  <div role="tablist" aria-label={label} className="no-bar flex gap-1 overflow-x-auto border-b border-line">
    {items.map(({ id, label: l, icon: Icon }) => (
      <button key={id} role="tab" type="button" aria-selected={value === id} onClick={() => onChange(id)}
        className={`relative flex min-h-[48px] shrink-0 items-center gap-2 px-4 font-semibold transition-colors ${value === id ? 'text-cream' : 'text-muted hover:text-cream'}`}>
        {Icon && <Icon size={17} aria-hidden />}{l}
        {value === id && <span className="ring-mark absolute inset-x-3 bottom-0 h-0.5 rounded-full" />}
      </button>
    ))}
  </div>
);

export const Modal = ({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-black/70 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface outline-none sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
          <h2 className="text-xl">{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-cream/5 hover:text-cream"><X size={20} aria-hidden /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const ScorePicker = ({ value, onChange, label, error }: { value: number; onChange: (n: number) => void; label: string; error?: boolean }) => (
  <div role="radiogroup" aria-label={label} className="flex gap-1.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} de 5`} onClick={() => onChange(n)}
        className={`h-11 w-11 rounded-lg border text-base font-semibold tabular-nums transition-colors
          ${value === n ? 'border-brand bg-brand text-cream' : value > n ? 'border-brand/50 bg-brand/15 text-cream' : `${error ? 'border-danger/60' : 'border-line'} text-muted hover:border-cream/40 hover:text-cream`}`}>
        {n}
      </button>
    ))}
  </div>
);

export const Stat = ({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) => (
  <Card className="p-4 sm:p-5">
    <p className="text-sm text-muted">{label}</p>
    <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-cream">{value}</p>
    {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
  </Card>
);

export const PageHeader = ({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0 max-w-2xl">
      {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      {children && <p className="mt-2 text-muted">{children}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);

interface Toast { id: number; text: string; tone: 'ok' | 'error' }
const ToastCtx = createContext<(text: string, tone?: 'ok' | 'error') => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} className="flex max-w-sm animate-rise items-center gap-2.5 rounded-xl border border-line bg-raised px-4 py-3 text-sm font-medium text-cream shadow-xl shadow-black/50">
            {t.tone === 'ok' ? <CheckCircle2 size={18} className="shrink-0 text-orange" aria-hidden /> : <AlertTriangle size={18} className="shrink-0 text-danger" aria-hidden />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
