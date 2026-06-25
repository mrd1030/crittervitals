import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { Txt, Card, AppButton, Chip, Divider } from "@/src/components/ui";
import { FormField, AppTextInput, Stepper } from "@/src/components/forms";
import { Header } from "@/src/components/Header";
import { useToast } from "@/src/components/Toast";
import { MedicationRepo } from "@/src/repositories";
import { DosageUnit, MedicationRoute } from "@/src/models/types";
import { scheduleMedicationReminders, cancelMedicationReminders } from "@/src/services/reminders";

const UNITS: DosageUnit[] = ["ml", "mg", "drops", "tablet", "g", "units"];
const ROUTES: MedicationRoute[] = ["oral", "topical", "eye", "injection", "other"];

function defaultTimes(freq: number): string[] {
  const presets: Record<number, string[]> = {
    1: ["09:00"],
    2: ["08:00", "20:00"],
    3: ["08:00", "14:00", "20:00"],
    4: ["08:00", "12:00", "16:00", "20:00"],
  };
  if (presets[freq]) return presets[freq];
  // Evenly spread across waking hours for higher frequencies.
  const out: string[] = [];
  for (let i = 0; i < freq; i++) {
    const h = Math.round(8 + (i * 12) / Math.max(1, freq - 1));
    out.push(`${String(Math.min(20, h)).padStart(2, "0")}:00`);
  }
  return out;
}

export default function MedicationEdit() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { activePet, bump } = useData();
  const editing = !!id;

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState<DosageUnit>("ml");
  const [route, setRoute] = useState<MedicationRoute>("oral");
  const [freq, setFreq] = useState(2);
  const [times, setTimes] = useState<string[]>(defaultTimes(2));
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (id) {
        const m = await MedicationRepo.getById(id);
        if (m) {
          setName(m.name); setDosage(m.dosage); setUnit(m.unit); setRoute(m.route);
          setFreq(m.frequencyPerDay); setTimes(m.times); setActive(m.active); setNotes(m.notes ?? "");
        }
      }
    })();
  }, [id]);

  const changeFreq = (f: number) => {
    setFreq(f);
    setTimes((prev) => {
      const next = defaultTimes(f);
      // Keep already-edited times where possible.
      return next.map((d, i) => prev[i] ?? d);
    });
  };

  const setTimeAt = (i: number, val: string) => {
    setTimes((prev) => prev.map((tm, idx) => (idx === i ? val : tm)));
  };

  const canSave = name.trim().length > 0 && dosage.trim().length > 0 && activePet;

  const save = async () => {
    if (!activePet) return;
    setBusy(true);
    const payload = {
      petId: activePet.id,
      name: name.trim(),
      dosage: dosage.trim(),
      unit, route,
      frequencyPerDay: freq,
      times,
      notes: notes.trim() || undefined,
      active,
      startDate: new Date().toISOString(),
    };
    let saved;
    if (editing && id) {
      await MedicationRepo.update(id, payload);
      saved = await MedicationRepo.getById(id);
    } else {
      saved = await MedicationRepo.insert(payload);
    }
    if (saved) await scheduleMedicationReminders(saved, activePet);
    bump();
    toast.show(editing ? "Medication updated" : "Medication added", "success");
    setBusy(false);
    router.back();
  };

  const remove = async () => {
    if (!id) return;
    await cancelMedicationReminders(id);
    await MedicationRepo.remove(id);
    bump();
    toast.show("Medication removed", "info");
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title={editing ? "Edit Medication" : "Add Medication"} showBack />

      <KeyboardAwareScrollView bottomOffset={90} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <FormField label="Name">
          <AppTextInput testID="med-name-input" value={name} onChangeText={setName} placeholder="e.g. Furosemide" />
        </FormField>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <FormField label="Dose amount" style={{ flex: 1 }} hint="Exact value, e.g. 0.1">
            <AppTextInput testID="med-dose-input" value={dosage} onChangeText={setDosage} keyboardType="decimal-pad" placeholder="0.1" />
          </FormField>
        </View>

        <FormField label="Unit">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {UNITS.map((u) => <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} testID={`unit-${u}`} />)}
          </View>
        </FormField>

        <FormField label="Route">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ROUTES.map((r) => <Chip key={r} label={r} selected={route === r} onPress={() => setRoute(r)} testID={`route-${r}`} />)}
          </View>
        </FormField>

        <FormField label="Times per day">
          <Stepper value={freq} onChange={changeFreq} min={1} max={6} testID="freq-stepper" />
        </FormField>

        <FormField label="Reminder times" hint="24h format, e.g. 08:00 or 20:30.">
          <View style={{ gap: 10 }}>
            {times.map((tm, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Txt size={13} weight="700" color={t.colors.onSurfaceTertiary} style={{ width: 56 }}>Dose {i + 1}</Txt>
                <View style={{ flex: 1 }}>
                  <AppTextInput testID={`time-input-${i}`} value={tm} onChangeText={(v) => setTimeAt(i, v)} placeholder="08:00" />
                </View>
              </View>
            ))}
          </View>
        </FormField>

        <Card style={{ flexDirection: "row", alignItems: "center", marginBottom: t.spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Txt size={15} weight="700">Active</Txt>
            <Txt size={12} color={t.colors.onSurfaceSecondary} style={{ marginTop: 2 }}>Pause to stop reminders & adherence tracking.</Txt>
          </View>
          <Pressable
            testID="med-active-toggle"
            onPress={() => setActive((a) => !a)}
            style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: active ? t.colors.brandPrimary : t.colors.surfaceTertiary, padding: 3, justifyContent: "center" }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", alignSelf: active ? "flex-end" : "flex-start" }} />
          </Pressable>
        </Card>

        <FormField label="Notes (optional)">
          <AppTextInput value={notes} onChangeText={setNotes} placeholder="Instructions, cautions…" multiline />
        </FormField>

        {editing && (
          <>
            <Divider style={{ marginVertical: t.spacing.md }} />
            <AppButton testID="delete-medication" title="Delete Medication" icon="trash-2" variant="ghost" onPress={remove} style={{ alignSelf: "center" }} fullWidth={false} />
          </>
        )}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={{ padding: t.spacing.lg, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: t.colors.divider, backgroundColor: t.colors.surface }}>
          <AppButton testID="save-medication-button" title={editing ? "Save Changes" : "Add Medication"} icon="check" disabled={!canSave} loading={busy} onPress={save} />
        </View>
      </KeyboardStickyView>
    </View>
  );
}
