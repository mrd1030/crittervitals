import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Medication, LogEntry, Photo } from "@/src/models/types";
import { MedicationRepo, LogRepo, PhotoRepo } from "@/src/repositories";
import { useData } from "@/src/store/DataContext";

// Loads all records for the active pet, refreshing whenever the screen gains
// focus or the global dataVersion bumps after a mutation.
export function usePetData() {
  const { activePet, dataVersion } = useData();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activePet) {
      setMeds([]);
      setLogs([]);
      setPhotos([]);
      setLoading(false);
      return;
    }
    const [m, l, p] = await Promise.all([
      MedicationRepo.getByPet(activePet.id),
      LogRepo.getByPet(activePet.id),
      PhotoRepo.getByPet(activePet.id),
    ]);
    setMeds(m);
    setLogs(l);
    setPhotos(p);
    setLoading(false);
  }, [activePet]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion]),
  );

  return { activePet, meds, logs, photos, loading, reload: load };
}

export interface DueDose {
  med: Medication;
  time: string;
  taken: boolean;
}

// Computes today's medication schedule and whether each slot has been logged.
export function computeTodaysDoses(meds: Medication[], logs: LogEntry[]): DueDose[] {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const takenToday = logs.filter(
    (l) => l.type === "medication" && l.loggedAt >= startOfDay,
  );

  const doses: DueDose[] = [];
  meds
    .filter((m) => m.active)
    .forEach((m) => {
      m.times.forEach((time) => {
        // A slot counts as taken if any medication log for this med exists today
        // within ±90 min of the scheduled time.
        const [h, min] = time.split(":").map(Number);
        const slot = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, min);
        const taken = takenToday.some((l) => {
          if (l.medicationId !== m.id) return false;
          const diff = Math.abs(new Date(l.loggedAt).getTime() - slot.getTime());
          return diff <= 90 * 60 * 1000;
        });
        doses.push({ med: m, time, taken });
      });
    });

  return doses.sort((a, b) => a.time.localeCompare(b.time));
}
