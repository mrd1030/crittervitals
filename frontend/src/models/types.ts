// Domain models for CritterVitals. Strongly typed where it matters,
// flexible where logging needs to be fast.

export type Species = "bearded_dragon" | "rabbit" | "other";

export type DosageUnit = "ml" | "mg" | "drops" | "tablet" | "g" | "units";

export type MedicationRoute = "oral" | "topical" | "eye" | "injection" | "other";

export type LogType =
  | "weight"
  | "symptom"
  | "medication"
  | "husbandry"
  | "note";

export type PhotoCategory = "eyes" | "overall" | "enclosure" | "stool" | "other";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  morph?: string;
  birthdate?: string; // ISO date
  photoUri?: string;
  chronicConditions: string[];
  weightGoalGrams?: number | null;
  notes?: string;
  createdAt: string; // ISO
}

export interface Medication {
  id: string;
  petId: string;
  name: string;
  // Dosage kept as a string to preserve precise fractional volumes like "0.1".
  // Parsing/formatting happens at the edges — never store as float to avoid
  // 0.1 + 0.2 style precision drift on critical medical values.
  dosage: string;
  unit: DosageUnit;
  route: MedicationRoute;
  frequencyPerDay: number;
  times: string[]; // ["08:00", "20:00"]
  notes?: string;
  active: boolean;
  startDate: string; // ISO
  createdAt: string;
}

export interface LogEntry {
  id: string;
  petId: string;
  type: LogType;
  loggedAt: string; // ISO — actual time the event happened
  createdAt: string; // ISO — when the row was written
  // weight
  weightGrams?: number | null;
  // symptom / energy
  symptom?: string;
  severity?: number; // 1..5
  energyLevel?: number; // 1..5
  // medication taken
  medicationId?: string;
  medicationName?: string;
  dosageGiven?: string; // e.g. "0.1 ml"
  // husbandry
  tempF?: number | null;
  humidity?: number | null;
  // free text + photo (any type can carry these)
  note?: string;
  photoUri?: string;
}

export interface Photo {
  id: string;
  petId: string;
  uri: string;
  category: PhotoCategory;
  note?: string;
  takenAt: string; // ISO
  createdAt: string;
}

export interface SpeciesTemplate {
  species: Species;
  label: string;
  emoji: string;
  defaultWeightGoalGrams: number;
  weightUnitHint: string;
  commonConditions: string[];
  symptomPresets: string[];
  husbandry: {
    tempRangeF: [number, number];
    humidityRange: [number, number];
    notes: string;
  };
  careTips: string[];
}
