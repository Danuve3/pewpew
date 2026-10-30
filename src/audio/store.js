// Guarda las grabaciones en IndexedDB como PCM (Float32Array), así no
// dependemos del códec que use cada navegador al grabar.
const DB = 'pewpew';
const STORE = 'sounds';

let dbp = null;
function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const s = t.objectStore(STORE);
        const out = fn(s);
        t.oncomplete = () => resolve(out?.result ?? out);
        t.onerror = () => reject(t.error);
      }),
  );
}

export async function loadAll() {
  try {
    const rows = await tx('readonly', (s) => s.getAll());
    return Object.fromEntries((rows || []).map((r) => [r.id, r]));
  } catch (e) {
    console.warn('No se pudieron cargar las grabaciones', e);
    return {};
  }
}

export async function saveSound(rec) {
  try {
    await tx('readwrite', (s) => s.put(rec));
  } catch (e) {
    console.warn('No se pudo guardar la grabación', e);
  }
}

export async function clearAll() {
  try {
    await tx('readwrite', (s) => s.clear());
  } catch (e) {
    console.warn(e);
  }
}
