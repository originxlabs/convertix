type HistoryMeta = {
  id: string;
  name: string;
  type: string;
  kind: "pdf" | "image" | "archive" | "doc";
  size: number;
  createdAt: string;
};

const META_KEY = "convertix-history-meta";
const DB_NAME = "convertix-history";
const STORE_NAME = "files";

const isBrowser = typeof window !== "undefined";

function loadMeta(): HistoryMeta[] {
  if (!isBrowser) return [];
  const raw = window.localStorage.getItem(META_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryMeta[];
  } catch {
    return [];
  }
}

function saveMeta(items: HistoryMeta[]) {
  if (!isBrowser) return;
  window.localStorage.setItem(META_KEY, JSON.stringify(items));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveHistoryItem(options: {
  name: string;
  blob: Blob;
  kind: "pdf" | "image" | "archive" | "doc";
}): Promise<HistoryMeta> {
  if (!isBrowser) {
    throw new Error("History store is only available in the browser.");
  }

  const id = crypto.randomUUID();
  const meta: HistoryMeta = {
    id,
    name: options.name,
    type: options.blob.type || (options.kind === "pdf" ? "application/pdf" : "image/png"),
    kind: options.kind,
    size: options.blob.size,
    createdAt: new Date().toISOString()
  };

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(options.blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const items = [meta, ...loadMeta()];
  saveMeta(items);
  window.dispatchEvent(new Event("convertix-history-updated"));
  return meta;
}

export async function getHistoryItems(): Promise<HistoryMeta[]> {
  const items = loadMeta();
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getHistoryBlob(id: string): Promise<Blob | null> {
  if (!isBrowser) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as Blob) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  if (!isBrowser) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const items = loadMeta().filter((item) => item.id !== id);
  saveMeta(items);
  window.dispatchEvent(new Event("convertix-history-updated"));
}
