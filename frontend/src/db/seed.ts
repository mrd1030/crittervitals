// Seeds species-template-driven sample data so the app feels immediately useful.
// Includes a sample bearded dragon ("Sunny") on heart medication
// (furosemide + enalapril), eye monitoring, and GI support (lactulose) — with
// ~3 weeks of realistic weight, symptom, medication, husbandry logs and photos.

import { Pet, Medication, LogEntry, Photo } from "@/src/models/types";
import { loadTable, saveTable, genId, TABLES } from "@/src/db/store";
import { storage } from "@/src/utils/storage";

const SEED_FLAG = "cv_seeded_v1";

function isoDaysAgo(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export async function isSeeded(): Promise<boolean> {
  return (await storage.getItem<boolean>(SEED_FLAG, false)) === true;
}

export async function seedSampleData(): Promise<string> {
  const petId = genId();
  const createdAt = isoDaysAgo(21);

  const pet: Pet = {
    id: petId,
    name: "Sunny",
    species: "bearded_dragon",
    morph: "Citrus Hypo",
    birthdate: isoDaysAgo(720),
    photoUri:
      "https://images.unsplash.com/photo-1601491472415-1b4b4a689212?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    chronicConditions: ["Heart support", "Eye inflammation", "GI motility"],
    weightGoalGrams: 480,
    notes:
      "Senior dragon with mild heart enlargement. Monitoring left eye for swelling. Occasional GI slowdown — lactulose as needed.",
    createdAt,
  };

  // Medications — precise fractional volumes preserved as strings.
  const furosemide: Medication = {
    id: genId(),
    petId,
    name: "Furosemide",
    dosage: "0.1",
    unit: "ml",
    route: "oral",
    frequencyPerDay: 2,
    times: ["08:00", "20:00"],
    notes: "Heart support diuretic. Ensure fresh water available.",
    active: true,
    startDate: createdAt,
    createdAt,
  };
  const enalapril: Medication = {
    id: genId(),
    petId,
    name: "Enalapril",
    dosage: "0.05",
    unit: "ml",
    route: "oral",
    frequencyPerDay: 1,
    times: ["08:00"],
    notes: "ACE inhibitor for cardiac support.",
    active: true,
    startDate: createdAt,
    createdAt,
  };
  const lactulose: Medication = {
    id: genId(),
    petId,
    name: "Lactulose",
    dosage: "0.2",
    unit: "ml",
    route: "oral",
    frequencyPerDay: 1,
    times: ["12:00"],
    notes: "GI motility support — give as needed when straining.",
    active: true,
    startDate: createdAt,
    createdAt,
  };

  const logs: LogEntry[] = [];

  // Weight trend over 21 days — gentle decline then recovery toward goal.
  const weights = [
    505, 503, 500, 498, 495, 492, 490, 488, 486, 485, 483, 482, 480, 481,
    482, 483, 484, 485, 486, 487, 488,
  ];
  weights.forEach((w, i) => {
    const day = 20 - i;
    logs.push({
      id: genId(),
      petId,
      type: "weight",
      loggedAt: isoDaysAgo(day, 9, 0),
      createdAt: isoDaysAgo(day, 9, 0),
      weightGrams: w,
    });
  });

  // Medication adherence — mostly taken, a few missed for realism.
  for (let day = 20; day >= 0; day--) {
    // Furosemide AM/PM
    if (!(day === 7)) {
      logs.push({
        id: genId(), petId, type: "medication",
        loggedAt: isoDaysAgo(day, 8, 5), createdAt: isoDaysAgo(day, 8, 5),
        medicationId: furosemide.id, medicationName: "Furosemide", dosageGiven: "0.1 ml",
      });
    }
    if (!(day === 3 || day === 12)) {
      logs.push({
        id: genId(), petId, type: "medication",
        loggedAt: isoDaysAgo(day, 20, 10), createdAt: isoDaysAgo(day, 20, 10),
        medicationId: furosemide.id, medicationName: "Furosemide", dosageGiven: "0.1 ml",
      });
    }
    // Enalapril AM
    if (!(day === 9)) {
      logs.push({
        id: genId(), petId, type: "medication",
        loggedAt: isoDaysAgo(day, 8, 6), createdAt: isoDaysAgo(day, 8, 6),
        medicationId: enalapril.id, medicationName: "Enalapril", dosageGiven: "0.05 ml",
      });
    }
    // Lactulose only some days
    if (day % 3 === 0) {
      logs.push({
        id: genId(), petId, type: "medication",
        loggedAt: isoDaysAgo(day, 12, 15), createdAt: isoDaysAgo(day, 12, 15),
        medicationId: lactulose.id, medicationName: "Lactulose", dosageGiven: "0.2 ml",
      });
    }
  }

  // Symptom / energy logs.
  const symptomDays: { day: number; symptom: string; severity: number; energy: number; note?: string }[] = [
    { day: 18, symptom: "Eye swelling", severity: 3, energy: 2, note: "Left eye looks puffy this morning." },
    { day: 14, symptom: "Low energy", severity: 2, energy: 2 },
    { day: 11, symptom: "Straining / no stool", severity: 3, energy: 3, note: "Gave lactulose, basked after." },
    { day: 7, symptom: "Eye discharge", severity: 2, energy: 3 },
    { day: 4, symptom: "Low energy", severity: 1, energy: 3 },
    { day: 1, symptom: "Eye swelling", severity: 1, energy: 4, note: "Swelling much improved." },
  ];
  symptomDays.forEach((s) => {
    logs.push({
      id: genId(), petId, type: "symptom",
      loggedAt: isoDaysAgo(s.day, 10, 30), createdAt: isoDaysAgo(s.day, 10, 30),
      symptom: s.symptom, severity: s.severity, energyLevel: s.energy, note: s.note,
    });
  });

  // Husbandry logs.
  [16, 9, 2].forEach((day) => {
    logs.push({
      id: genId(), petId, type: "husbandry",
      loggedAt: isoDaysAgo(day, 11, 0), createdAt: isoDaysAgo(day, 11, 0),
      tempF: 102, humidity: 35, note: "Basking spot stable, UVB on schedule.",
    });
  });

  // Free notes.
  logs.push({
    id: genId(), petId, type: "note",
    loggedAt: isoDaysAgo(5, 19, 0), createdAt: isoDaysAgo(5, 19, 0),
    note: "Ate two crickets and some greens tonight. Good appetite.",
  });

  // Photo journal — eye monitoring over time for comparison.
  const photos: Photo[] = [
    {
      id: genId(), petId,
      uri: "https://images.unsplash.com/photo-1597284598539-3a4a4b3b2c9e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
      category: "eyes", note: "Left eye — swelling visible", takenAt: isoDaysAgo(18, 10, 35), createdAt: isoDaysAgo(18),
    },
    {
      id: genId(), petId,
      uri: "https://images.unsplash.com/photo-1633957897986-70e83293f3ff?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
      category: "eyes", note: "Left eye — improving", takenAt: isoDaysAgo(1, 10, 35), createdAt: isoDaysAgo(1),
    },
    {
      id: genId(), petId,
      uri: "https://images.unsplash.com/photo-1601491472415-1b4b4a689212?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
      category: "overall", note: "Overall body condition", takenAt: isoDaysAgo(10, 12, 0), createdAt: isoDaysAgo(10),
    },
    {
      id: genId(), petId,
      uri: "https://images.unsplash.com/photo-1518562180175-34a163b1a9a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
      category: "enclosure", note: "Enclosure setup check", takenAt: isoDaysAgo(16, 11, 5), createdAt: isoDaysAgo(16),
    },
  ];

  // Persist alongside any existing data.
  const existingPets = await loadTable<Pet>(TABLES.pets);
  await saveTable(TABLES.pets, [...existingPets, pet]);
  const existingMeds = await loadTable<Medication>(TABLES.medications);
  await saveTable(TABLES.medications, [...existingMeds, furosemide, enalapril, lactulose]);
  const existingLogs = await loadTable<LogEntry>(TABLES.logs);
  await saveTable(TABLES.logs, [...existingLogs, ...logs]);
  const existingPhotos = await loadTable<Photo>(TABLES.photos);
  await saveTable(TABLES.photos, [...existingPhotos, ...photos]);

  await storage.setItem(SEED_FLAG, true);
  return petId;
}

export async function resetAllData(): Promise<void> {
  await saveTable(TABLES.pets, []);
  await saveTable(TABLES.medications, []);
  await saveTable(TABLES.logs, []);
  await saveTable(TABLES.photos, []);
  await storage.removeItem(SEED_FLAG);
}
