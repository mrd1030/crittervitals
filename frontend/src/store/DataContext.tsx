import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { storage } from "@/src/utils/storage";
import { Pet } from "@/src/models/types";
import { PetRepo, MedicationRepo, LogRepo, PhotoRepo } from "@/src/repositories";
import { seedSampleData, isSeeded } from "@/src/db/seed";
import { ThemeMode } from "@/src/theme/theme";

const ACTIVE_PET_KEY = "cv_active_pet";
const ONBOARDED_KEY = "cv_onboarded";
const THEME_PREF_KEY = "cv_theme_pref";
const WEIGHT_UNIT_KEY = "cv_weight_unit";

type ThemePref = "light" | "dark" | "system";
type WeightUnit = "g" | "kg";

interface DataContextValue {
  loading: boolean;
  pets: Pet[];
  activePet: Pet | null;
  dataVersion: number;
  onboarded: boolean;
  themePref: ThemePref;
  resolvedMode: ThemeMode;
  weightUnit: WeightUnit;
  refresh: () => Promise<void>;
  bump: () => void;
  setActivePet: (id: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setThemePref: (pref: ThemePref) => Promise<void>;
  setWeightUnit: (u: WeightUnit) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [onboarded, setOnboarded] = useState(false);
  const [themePref, setThemePrefState] = useState<ThemePref>("system");
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("g");

  const refresh = useCallback(async () => {
    const all = await PetRepo.getAll();
    setPets(all);
    const storedActive = await storage.getItem<string>(ACTIVE_PET_KEY, "");
    let active = storedActive;
    if (!active || !all.find((p) => p.id === active)) {
      active = all.length ? all[0].id : "";
      if (active) await storage.setItem(ACTIVE_PET_KEY, active);
    }
    setActivePetId(active || null);
  }, []);

  const bump = useCallback(() => setDataVersion((v) => v + 1), []);

  useEffect(() => {
    (async () => {
      if (!(await isSeeded())) {
        await seedSampleData();
      }
      const ob = await storage.getItem<boolean>(ONBOARDED_KEY, false);
      setOnboarded(ob === true);
      const tp = await storage.getItem<ThemePref>(THEME_PREF_KEY, "system");
      setThemePrefState((tp as ThemePref) ?? "system");
      const wu = await storage.getItem<WeightUnit>(WEIGHT_UNIT_KEY, "g");
      setWeightUnitState((wu as WeightUnit) ?? "g");
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const setActivePet = useCallback(async (id: string) => {
    await storage.setItem(ACTIVE_PET_KEY, id);
    setActivePetId(id);
    bump();
  }, [bump]);

  const completeOnboarding = useCallback(async () => {
    await storage.setItem(ONBOARDED_KEY, true);
    setOnboarded(true);
  }, []);

  const setThemePref = useCallback(async (pref: ThemePref) => {
    await storage.setItem(THEME_PREF_KEY, pref);
    setThemePrefState(pref);
  }, []);

  const setWeightUnit = useCallback(async (u: WeightUnit) => {
    await storage.setItem(WEIGHT_UNIT_KEY, u);
    setWeightUnitState(u);
  }, []);

  // NEW: Clear all data and reset to fresh state
  const clearAllData = useCallback(async () => {
    await PetRepo.clearAll();
    await MedicationRepo.clearAll();
    await LogRepo.clearAll();
    await PhotoRepo.clearAll();
    await storage.removeItem(ACTIVE_PET_KEY);
    await storage.removeItem(ONBOARDED_KEY);
    setOnboarded(false);
    setActivePetId(null);
    setPets([]);
    bump();
  }, [bump]);

  const resolvedMode: ThemeMode =
    themePref === "system" ? (systemScheme === "dark" ? "dark" : "light") : themePref;

  const activePet = pets.find((p) => p.id === activePetId) ?? null;

  return (
    <DataContext.Provider
      value={{
        loading,
        pets,
        activePet,
        dataVersion,
        onboarded,
        themePref,
        resolvedMode,
        weightUnit,
        refresh,
        bump,
        setActivePet,
        completeOnboarding,
        setThemePref,
        setWeightUnit,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
