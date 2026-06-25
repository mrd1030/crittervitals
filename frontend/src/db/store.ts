// Offline-first persisted store. Local device storage is the single source of
// truth (the app works fully offline). Each "table" is a JSON collection cached
// in memory and flushed to the platform storage util (AsyncStorage native /
// localStorage web). This keeps a clean Repository pattern while staying
// reliable on every platform the app runs on.

import { storage } from "@/src/utils/storage";

const PREFIX = "cv_table_";
const cache: Record<string, unknown[]> = {};

export function genId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function loadTable<T>(name: string): Promise<T[]> {
  if (cache[name]) return cache[name] as T[];
  const raw = await storage.getItem<string>(`${PREFIX}${name}`, "[]");
  let parsed: T[] = [];
  try {
    parsed = raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    parsed = [];
  }
  cache[name] = parsed;
  return parsed;
}

export async function saveTable<T>(name: string, rows: T[]): Promise<void> {
  cache[name] = rows;
  await storage.setItem(`${PREFIX}${name}`, JSON.stringify(rows));
}

export async function clearAllTables(names: string[]): Promise<void> {
  for (const n of names) {
    cache[n] = [];
    await storage.removeItem(`${PREFIX}${n}`);
  }
}

export const TABLES = {
  pets: "pets",
  medications: "medications",
  logs: "logs",
  photos: "photos",
} as const;
