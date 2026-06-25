// TrendAnalysisService — turns raw logs into chart-ready series and lightweight
// insights. Pure functions, no side effects, easy to test.

import { LogEntry, Medication } from "@/src/models/types";

export interface WeightPoint {
  value: number;
  label: string;
  dateIso: string;
}

export interface AdherenceResult {
  expected: number;
  taken: number;
  rate: number; // 0..1
  perMed: { name: string; taken: number; expected: number; rate: number }[];
}

export interface SymptomCount {
  symptom: string;
  count: number;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function buildWeightSeries(logs: LogEntry[]): WeightPoint[] {
  return logs
    .filter((l) => l.type === "weight" && typeof l.weightGrams === "number")
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .map((l) => ({
      value: l.weightGrams as number,
      label: shortDate(l.loggedAt),
      dateIso: l.loggedAt,
    }));
}

export function latestWeight(logs: LogEntry[]): number | null {
  const s = buildWeightSeries(logs);
  return s.length ? s[s.length - 1].value : null;
}

export function weightDelta(logs: LogEntry[], days = 7): number | null {
  const s = buildWeightSeries(logs);
  if (s.length < 2) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const past = s.find((p) => new Date(p.dateIso) >= cutoff) ?? s[0];
  const last = s[s.length - 1];
  return last.value - past.value;
}

/**
 * Calculates adherence over the last N days using a per-day maximum model.
 * 
 * For each day in the window:
 *   - Calculate how many doses were *expected* that day per medication
 *   - Sum across all days and medications
 * 
 * This matches the original intended behavior (daily max summed over the period).
 */
export function computeAdherence(
  logs: LogEntry[],
  meds: Medication[],
  days = 7,
): AdherenceResult {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();

  const activeMeds = meds.filter((m) => m.active);

  let totalExpected = 0;
  const perMedMap = new Map<string, { taken: number; expected: number }>();

  // Initialize per-med tracking
  activeMeds.forEach((m) => {
    perMedMap.set(m.id, { taken: 0, expected: 0 });
  });

  // Loop through each day in the window
  for (let i = 0; i < days; i++) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    activeMeds.forEach((m) => {
      // Only count expected doses if the medication was active on this day
      const medStart = new Date(m.startDate);
      if (medStart > dayEnd) return; // medication not started yet on this day

      const dailyExpected = m.frequencyPerDay;
      const entry = perMedMap.get(m.id)!;
      entry.expected += dailyExpected;
      totalExpected += dailyExpected;
    });
  }

  // Count actual taken doses in the window
  const takenLogs = logs.filter(
    (l) => l.type === "medication" && l.loggedAt >= cutoffIso
  );

  // Distribute taken counts per medication
  takenLogs.forEach((log) => {
    if (log.medicationId && perMedMap.has(log.medicationId)) {
      perMedMap.get(log.medicationId)!.taken += 1;
    }
  });

  const perMed = activeMeds.map((m) => {
    const data = perMedMap.get(m.id)!;
    return {
      name: m.name,
      taken: data.taken,
      expected: data.expected,
      rate: data.expected > 0 ? Math.min(1, data.taken / data.expected) : 0,
    };
  });

  const taken = perMed.reduce((sum, m) => sum + m.taken, 0);

  return {
    expected: totalExpected,
    taken,
    rate: totalExpected > 0 ? Math.min(1, taken / totalExpected) : 0,
    perMed,
  };
}

export function symptomFrequency(logs: LogEntry[], days = 30): SymptomCount[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();
  const counts: Record<string, number> = {};
  logs
    .filter(
      (l) => l.type === "symptom" && l.symptom && l.loggedAt >= cutoffIso,
    )
    .forEach((l) => {
      counts[l.symptom as string] = (counts[l.symptom as string] || 0) + 1;
    });
  return Object.entries(counts)
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count);
}

export function energySeries(logs: LogEntry[]): { value: number; label: string }[] {
  return logs
    .filter((l) => l.type === "symptom" && typeof l.energyLevel === "number")
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .map((l) => ({ value: l.energyLevel as number, label: shortDate(l.loggedAt) }));
}

export function buildInsights(logs: LogEntry[], meds: Medication[]): string[] {
  const insights: string[] = [];
  const delta = weightDelta(logs, 7);
  if (delta !== null) {
    if (delta <= -5) insights.push(`Weight down ${Math.abs(delta)}g this week — keep monitoring.`);
    else if (delta >= 5) insights.push(`Weight up ${delta}g this week — trending well.`);
    else insights.push(`Weight stable this week (${delta >= 0 ? "+" : ""}${delta}g).`);
  }
  const adh = computeAdherence(logs, meds, 7);
  if (adh.expected > 0) {
    insights.push(`Medication adherence ${Math.round(adh.rate * 100)}% over 7 days.`);
  }
  const sym = symptomFrequency(logs, 7);
  if (sym.length) {
    insights.push(`Most logged symptom this week: ${sym[0].symptom} (${sym[0].count}x).`);
  }
  return insights;
}
