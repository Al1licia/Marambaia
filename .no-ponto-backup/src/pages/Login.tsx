import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, FlaskConical, GraduationCap, LogIn, ShieldCheck, type LucideIcon } from 'lucide-react';
import { DEMO_PASSWORD, HOUSE, USERS } from '../data/seed';
import { useApp } from '../store/AppContext';
import { LogoMark } from '../components/Logo';
import { Button, Field } from '../components/ui';
import type { Role } from '../types';

const PROFILES: { role: Role; label: string; desc: string; icon: LucideIcon }[] = [
  { role: 'admin', label: 'Administrador', desc: 'Todas as funcionalidades', icon: ShieldCheck },
  { role: 'mestre', label: 'Cozinheiro Mestre', desc: 'Vídeos, fichas e avaliações', icon: ChefHat },
  { role: 'aprendiz', label: 'Aprendiz', desc: 'Conteúdo aprovado e seu progresso', icon: GraduationCap },
];

const PILLARS = [
  ['Conhecimento', 'Registrar as decisões que definem cada prato.'],
  ['Pessoas', 'Formar a equipe e reconhecer quem domina a técnica.'],
  ['Consistência', 'Acompanhar se o sabor continua sendo o da casa.'],
];

export const Login = () => {
  const { user, login } = useApp();
  const nav = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/inicio" replace />;

  const pick = (r: Role) => {
    setRole(r);
    setEmail(USERS.find((u) => u.role === r)!.email);
    setPassword(DEMO_PASSWORD);
    setErrors({});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Informe seu e-mail.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Confira o e-mail. Exemplo: nome@dominio.com';
    if (!password) next.password = 'Informe sua senha.';
    if (!next.email && !next.password) {
      const found = USERS.find((u) => u.email === email.trim().toLowerCase());
      if (!found || password !== DEMO_PASSWORD) next.form = 'E-mail ou senha não conferem. Selecione um perfil demonstrativo para preencher os dados.';
      else {
        setErrors({});
        setLoading(true);
        setTimeout(() => { login(found); nav('/inicio'); }, 350);
        return;
      }
    }
    setErrors(next);
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden px-6 py-8 sm:px-12 lg:py-12">
        <div aria-hidden className="pointer-events-none absolute -bottom-[22rem] -left-[16rem] h-[46rem] w-[46rem] rounded-full border border-orange/20" />
        <div aria-hidden className="pointer-events-none absolute -bottom-[28rem] -left-[22rem] h-[58rem] w-[58rem] rounded-full border border-magenta/15" />
        <div className="relative flex items-center gap-5 lg:block">
          <LogoMark size={148} className="hidden lg:block" />
          <LogoMark size={84} className="lg:hidden" />
          <div className="lg:mt-8">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl">Ponto Zero</h1>
            <p className="mt-2 font-display text-lg italic text-body sm:text-xl lg:mt-4 lg:text-2xl">Preservando sabores. Compartilhando histórias.</p>
          </div>
        </div>
        <ul className="relative mt-12 hidden max-w-xl gap-5 lg:grid lg:grid-cols-3">
          {PILLARS.map(([t, d]) => (
            <li key={t}>
              <p className="font-display text-lg font-semibold text-cream">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center border-line bg-surface/60 px-6 py-8 sm:px-12 lg:border-l">
        <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-md flex-col gap-5">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/10 px-2.5 py-1 text-xs font-semibold text-orange">
              <FlaskConical size={13} aria-hidden /> Acesso demonstrativo
            </p>
            <h2 className="text-2xl font-semibold">Entrar no {HOUSE}</h2>
            <p className="mt-1 text-sm text-muted">Escolha um perfil para a apresentação. Não há autenticação real neste protótipo.</p>
          </div>

          <div role="radiogroup" aria-label="Perfil demonstrativo" className="grid gap-2">
            {PROFILES.map(({ role: r, label, desc, icon: Icon }) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => pick(r)}
                className={`flex min-h-[60px] items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-colors ${role === r ? 'border-cream/70 bg-cream/10' : 'border-line hover:border-cream/30'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${role === r ? 'bg-brand text-cream' : 'bg-raised text-cream'}`}><Icon size={20} aria-hidden /></span>
                <span><span className="block font-semibold text-cream">{label}</span><span className="block text-sm text-muted">{desc}</span></span>
              </button>
            ))}
          </div>

          <Field label="E-mail" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="off" className="field" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Senha" htmlFor="password" error={errors.password}>
            <div className="relative">
              <input id="password" type={show ? 'text' : 'password'} autoComplete="off" className="field pr-12" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Exibir senha'} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:text-cream">
                {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
              </button>
            </div>
          </Field>
          {errors.form && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{errors.form}</p>}
          <Button type="submit" icon={LogIn} loading={loading} className="w-full">Entrar</Button>
        </form>
      </section>
    </div>
  );
};
