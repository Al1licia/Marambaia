/** Guarda o vídeo local no IndexedDB do próprio navegador. Nada é enviado para fora. */
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('ponto-zero-videos', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('videos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction('videos', mode).objectStore('videos'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const memory = new Map<string, Blob>();

export const saveVideo = async (id: string, file: Blob) => {
  memory.set(id, file);
  try { await run('readwrite', (s) => s.put(file, id)); return true; } catch { return false; }
};
export const loadVideo = async (id: string): Promise<Blob | null> => {
  if (memory.has(id)) return memory.get(id)!;
  try { return ((await run('readonly', (s) => s.get(id))) as Blob) ?? null; } catch { return null; }
};
export const removeVideo = async (id: string) => {
  memory.delete(id);
  try { await run('readwrite', (s) => s.delete(id)); } catch { /* sem armazenamento disponível */ }
};
