import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createSeed, USERS } from '../data/seed';
import type { DB, Role, User } from '../types';

const DB_KEY = 'ponto-zero:db:v1';
const USER_KEY = 'ponto-zero:user:v1';

const read = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* armazenamento indisponível: segue em memória */ }
};

const freshDb = (): DB => structuredClone(createSeed());

const loadDb = (): DB => {
  const raw = read(DB_KEY);
  if (!raw) return freshDb();
  try {
    const parsed = JSON.parse(raw) as DB;
    return parsed.dishes?.length ? parsed : freshDb();
  } catch {
    return freshDb();
  }
};

export interface Permissions {
  validate: boolean;
  edit: boolean;
  evaluate: boolean;
  feedback: boolean;
  seeAllProgress: boolean;
}

const permissionsFor = (role: Role | undefined): Permissions => ({
  validate: role === 'admin' || role === 'mestre',
  edit: role === 'admin' || role === 'mestre',
  evaluate: role === 'admin' || role === 'mestre',
  feedback: role === 'admin',
  seeAllProgress: role === 'admin' || role === 'mestre',
});

interface Ctx {
  db: DB;
  user: User | null;
  can: Permissions;
  login: (u: User) => void;
  logout: () => void;
  update: (fn: (db: DB) => DB) => void;
  reset: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<DB>(loadDb);
  const [user, setUser] = useState<User | null>(() => USERS.find((u) => u.id === read(USER_KEY)) ?? null);

  useEffect(() => write(DB_KEY, JSON.stringify(db)), [db]);

  const login = useCallback((u: User) => { write(USER_KEY, u.id); setUser(u); }, []);
  const logout = useCallback(() => { write(USER_KEY, null); setUser(null); }, []);
  const update = useCallback((fn: (d: DB) => DB) => setDb(fn), []);
  const reset = useCallback(() => setDb(freshDb()), []);

  const value = useMemo(
    () => ({ db, user, can: permissionsFor(user?.role), login, logout, update, reset }),
    [db, user, login, logout, update, reset],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
};

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp fora do AppProvider');
  return c;
};
