import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpenText, Clapperboard, Home, LogOut, Lock, Menu, MessagesSquare, RotateCcw, TrendingUp, X, type LucideIcon } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { HOUSE } from '../data/seed';
import { LogoMark, Wordmark } from './Logo';
import { Avatar, Button, Modal, useToast } from './ui';

export const ROLE_LABEL = { admin: 'Administrador', mestre: 'Cozinheiro Mestre', aprendiz: 'Aprendiz' } as const;

export const Layout = () => {
  const { user, can, logout, reset } = useApp();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const nav = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); menuBtn.current?.focus(); };
  }, [open]);

  if (!user) return null;

  const items: { to: string; label: string; icon: LucideIcon; locked?: boolean; active?: boolean }[] = [
    { to: '/inicio', label: 'Início', icon: Home },
    { to: '/videos', label: 'Vídeos Explicativos', icon: Clapperboard },
    { to: '/fichas', label: 'Fichas Técnicas', icon: BookOpenText },
    { to: '/progresso', label: 'Progresso e Avaliação Interna', icon: TrendingUp, active: pathname.startsWith('/avaliacao') },
    { to: '/feedback', label: 'Feedback dos Clientes', icon: MessagesSquare, locked: !can.feedback },
  ];

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
          <button ref={menuBtn} type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)}
            className="-ml-2 flex h-12 w-12 items-center justify-center rounded-xl text-cream hover:bg-cream/5">
            <Menu size={24} aria-hidden />
          </button>
          <Link to="/inicio" className="flex items-center gap-2.5" aria-label="No Ponto, ir para o início">
            <LogoMark size={38} />
            <Wordmark className="hidden text-xl min-[420px]:block" />
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-semibold text-cream">{user.name}</p>
              <p className="truncate text-xs text-muted">{ROLE_LABEL[user.role]}</p>
            </div>
            <Avatar name={user.name} size={40} />
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 animate-fade bg-black/60" onClick={() => setOpen(false)}>
          <nav aria-label="Menu principal" onClick={(e) => e.stopPropagation()}
            className="flex h-full w-[86%] max-w-[340px] animate-drawer flex-col overflow-y-auto border-r border-line bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2.5"><LogoMark size={40} /><Wordmark className="text-xl" /></span>
              <button ref={closeBtn} type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-cream/5 hover:text-cream"><X size={22} aria-hidden /></button>
            </div>
            <ul className="flex flex-col gap-1">
              {items.map(({ to, label, icon: Icon, locked, active }) => (
                <li key={to}>
                  <NavLink to={to} onClick={() => setOpen(false)}
                    className={({ isActive }) => `flex min-h-[52px] items-center gap-3 rounded-xl px-3 font-medium transition-colors ${isActive || active ? 'bg-brand text-paper' : 'text-body hover:bg-cream/5'}`}>
                    <Icon size={20} aria-hidden className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {locked && <Lock size={15} aria-label="Acesso restrito" className="text-muted" />}
                  </NavLink>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => { logout(); nav('/login'); }} className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 font-medium text-body hover:bg-cream/5">
                  <LogOut size={20} aria-hidden /> Sair
                </button>
              </li>
            </ul>
            <div className="mt-auto pt-6">
              <button type="button" onClick={() => setConfirmReset(true)} className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-sm text-muted hover:bg-cream/5 hover:text-cream">
                <RotateCcw size={16} aria-hidden /> Restaurar dados demonstrativos
              </button>
              <p className="px-3 pt-1 text-xs text-muted">{HOUSE} é um estabelecimento fictício. Protótipo com dados demonstrativos.</p>
            </div>
          </nav>
        </div>
      )}

      {confirmReset && (
        <Modal title="Restaurar dados demonstrativos?" onClose={() => setConfirmReset(false)}>
          <p className="text-muted">Avaliações, feedbacks, marcações e edições feitas nesta apresentação serão apagados deste navegador. Vídeos carregados continuam guardados.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancelar</Button>
            <Button icon={RotateCcw} onClick={() => { reset(); setConfirmReset(false); setOpen(false); toast('Dados demonstrativos restaurados.'); nav('/inicio'); }}>Restaurar</Button>
          </div>
        </Modal>
      )}

      <main className="mx-auto max-w-6xl animate-rise px-4 pb-16 pt-6 sm:px-6 sm:pt-8" key={pathname}>
        <Outlet />
      </main>
    </div>
  );
};
