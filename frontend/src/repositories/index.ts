import { Pet, Medication, LogEntry, Photo, LogType, PhotoCategory } from "@/src/models/types";
import { loadTable, saveTable, genId, nowIso, TABLES } from "@/src/db/store";

// ---------- Pets ----------
export const PetRepo = {
  async getAll(): Promise<Pet[]> {
    const rows = await loadTable<Pet>(TABLES.pets);
    return [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async getById(id: string): Promise<Pet | undefined> {
    const rows = await loadTable<Pet>(TABLES.pets);
    return rows.find((p) => p.id === id);
  },
  async insert(data: Omit<Pet, "id" | "createdAt">): Promise<Pet> {
    const rows = await loadTable<Pet>(TABLES.pets);
    const pet: Pet = { ...data, id: genId(), createdAt: nowIso() };
    await saveTable(TABLES.pets, [...rows, pet]);
    return pet;
  },
  async update(id: string, patch: Partial<Pet>): Promise<void> {
    const rows = await loadTable<Pet>(TABLES.pets);
    await saveTable(
      TABLES.pets,
      rows.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  },
  async remove(id: string): Promise<void> {
    const pets = await loadTable<Pet>(TABLES.pets);
    await saveTable(TABLES.pets, pets.filter((p) => p.id !== id));
    // Cascade delete related records.
    const meds = await loadTable<Medication>(TABLES.medications);
    await saveTable(TABLES.medications, meds.filter((m) => m.petId !== id));
    const logs = await loadTable<LogEntry>(TABLES.logs);
    await saveTable(TABLES.logs, logs.filter((l) => l.petId !== id));
    const photos = await loadTable<Photo>(TABLES.photos);
    await saveTable(TABLES.photos, photos.filter((ph) => ph.petId !== id));
  },
};

// ---------- Medications ----------
export const MedicationRepo = {
  async getByPet(petId: string): Promise<Medication[]> {
    const rows = await loadTable<Medication>(TABLES.medications);
    return rows
      .filter((m) => m.petId === petId)
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
  },
  async getActiveByPet(petId: string): Promise<Medication[]> {
    const rows = await loadTable<Medication>(TABLES.medications);
    return rows.filter((m) => m.petId === petId && m.active);
  },
  async getById(id: string): Promise<Medication | undefined> {
    const rows = await loadTable<Medication>(TABLES.medications);
    return rows.find((m) => m.id === id);
  },
  async insert(data: Omit<Medication, "id" | "createdAt">): Promise<Medication> {
    const rows = await loadTable<Medication>(TABLES.medications);
    const med: Medication = { ...data, id: genId(), createdAt: nowIso() };
    await saveTable(TABLES.medications, [...rows, med]);
    return med;
  },
  async update(id: string, patch: Partial<Medication>): Promise<void> {
    const rows = await loadTable<Medication>(TABLES.medications);
    await saveTable(
      TABLES.medications,
      rows.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  },
  async remove(id: string): Promise<void> {
    const rows = await loadTable<Medication>(TABLES.medications);
    await saveTable(TABLES.medications, rows.filter((m) => m.id !== id));
  },
};

// ---------- Logs ----------
export const LogRepo = {
  async getByPet(petId: string, limit?: number): Promise<LogEntry[]> {
    const rows = await loadTable<LogEntry>(TABLES.logs);
    const sorted = rows
      .filter((l) => l.petId === petId)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
    return limit ? sorted.slice(0, limit) : sorted;
  },
  async getByPetAndType(petId: string, type: LogType): Promise<LogEntry[]> {
    const rows = await loadTable<LogEntry>(TABLES.logs);
    return rows
      .filter((l) => l.petId === petId && l.type === type)
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  },
  async getByPetSince(petId: string, sinceIso: string): Promise<LogEntry[]> {
    const rows = await loadTable<LogEntry>(TABLES.logs);
    return rows
      .filter((l) => l.petId === petId && l.loggedAt >= sinceIso)
      .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  },
  async insert(data: Omit<LogEntry, "id" | "createdAt">): Promise<LogEntry> {
    const rows = await loadTable<LogEntry>(TABLES.logs);
    const entry: LogEntry = { ...data, id: genId(), createdAt: nowIso() };
    await saveTable(TABLES.logs, [...rows, entry]);
    return entry;
  },
  async remove(id: string): Promise<void> {
    const rows = await loadTable<LogEntry>(TABLES.logs);
    await saveTable(TABLES.logs, rows.filter((l) => l.id !== id));
  },
};

// ---------- Photos ----------
export const PhotoRepo = {
  async getByPet(petId: string): Promise<Photo[]> {
    const rows = await loadTable<Photo>(TABLES.photos);
    return rows
      .filter((p) => p.petId === petId)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  },
  async getByPetAndCategory(petId: string, category: PhotoCategory): Promise<Photo[]> {
    const rows = await loadTable<Photo>(TABLES.photos);
    return rows
      .filter((p) => p.petId === petId && p.category === category)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  },
  async insert(data: Omit<Photo, "id" | "createdAt">): Promise<Photo> {
    const rows = await loadTable<Photo>(TABLES.photos);
    const photo: Photo = { ...data, id: genId(), createdAt: nowIso() };
    await saveTable(TABLES.photos, [...rows, photo]);
    return photo;
  },
  async remove(id: string): Promise<void> {
    const rows = await loadTable<Photo>(TABLES.photos);
    await saveTable(TABLES.photos, rows.filter((p) => p.id !== id));
  },
};
