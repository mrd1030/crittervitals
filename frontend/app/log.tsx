import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { usePetData } from "@/src/hooks/usePetData";
import { Txt, Card, AppButton, Chip, Display } from "@/src/components/ui";
import { FormField, AppTextInput } from "@/src/components/forms";
import { Header } from "@/src/components/Header";
import { useToast } from "@/src/components/Toast";
import { LogRepo, PhotoRepo } from "@/src/repositories";
import { SPECIES_TEMPLATES } from "@/src/constants/species";
import { LogType, Medication } from "@/src/models/types";
import { capturePhoto, pickPhoto } from "@/src/services/photos";
import { timeLabel } from "@/src/utils/format";

const TYPES: { key: LogType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "weight", label: "Weight", icon: "trending-up" },
  { key: "symptom", label: "Symptom", icon: "activity" },
  { key: "medication", label: "Medication", icon: "clock" },
  { key: "husbandry", label: "Husbandry", icon: "thermometer" },
  { key: "note", label: "Note", icon: "edit-3" },
];

function Scale({
  value,
  onChange,
  testID,
}: {
  value: number;
  onChange: (v: number) => void;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: "row", gap: 10 }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value >= n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{
              flex: 1, height: 46, borderRadius: 12,
              alignItems: "center", justifyContent: "center",
              backgroundColor: active ? t.colors.brandPrimary : t.colors.surfaceSecondary,
              borderWidth: 1, borderColor: active ? t.colors.brandPrimary : t.colors.border,
            }}
          >
            <Txt size={16} weight="800" color={active ? t.colors.onBrandPrimary : t.colors.onSurfaceTertiary}>{n}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function LogScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { activePet, bump } = useData();
  const { meds } = usePetData();

  const [type, setType] = useState<LogType>("weight");
  const [busy, setBusy] = useState(false);

  // shared
  const [note, setNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  // weight
  const [weight, setWeight] = useState("");
  // symptom
  const [symptom, setSymptom] = useState("");
  const [customSymptom, setCustomSymptom] = useState("");
  const [severity, setSeverity] = useState(2);
  const [energy, setEnergy] = useState(3);
  // medication
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [doseGiven, setDoseGiven] = useState("");
  const [doseTime, setDoseTime] = useState<string>("now");
  // husbandry
  const [tempF, setTempF] = useState("");
  const [humidity, setHumidity] = useState("");

  if (!activePet) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
        <Header title="Quick Log" showBack />
        <View style={{ padding: 24 }}>
          <Txt>Select a pet first.</Txt>
        </View>
      </View>
    );
  }

  const template = SPECIES_TEMPLATES[activePet.species];

  const computeLoggedAt = (): string => {
    if (type === "medication" && doseTime !== "now") {
      const [h, m] = doseTime.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    }
    return new Date().toISOString();
  };

  const attachPhoto = async (mode: "camera" | "library") => {
    const res = mode === "camera" ? await capturePhoto() : await pickPhoto();
    if (res.ok) setPhotoUri(res.uri);
    else if (res.reason === "blocked") toast.show("Enable photo access in Settings", "error");
    else if (res.reason === "error") toast.show("Could not open photos", "error");
  };

  const canSave = (() => {
    if (type === "weight") return weight.trim().length > 0 && !isNaN(Number(weight));
    if (type === "symptom") return (symptom || customSymptom.trim()).length > 0;
    if (type === "medication") return !!selectedMed;
    if (type === "husbandry") return tempF.trim().length > 0 || humidity.trim().length > 0;
    return note.trim().length > 0;
  })();

  const save = async () => {
    setBusy(true);
    const loggedAt = computeLoggedAt();
    const base = { petId: activePet.id, loggedAt, note: note.trim() || undefined, photoUri };

    if (type === "weight") {
      await LogRepo.insert({ ...base, type: "weight", weightGrams: Number(weight) });
    } else if (type === "symptom") {
      await LogRepo.insert({ ...base, type: "symptom", symptom: customSymptom.trim() || symptom, severity, energyLevel: energy });
    } else if (type === "medication" && selectedMed) {
      await LogRepo.insert({
        ...base, type: "medication",
        medicationId: selectedMed.id, medicationName: selectedMed.name,
        dosageGiven: (doseGiven.trim() || `${selectedMed.dosage} ${selectedMed.unit}`),
      });
    } else if (type === "husbandry") {
      await LogRepo.insert({ ...base, type: "husbandry", tempF: tempF ? Number(tempF) : null, humidity: humidity ? Number(humidity) : null });
    } else {
      await LogRepo.insert({ ...base, type: "note" });
    }

    // If a photo was attached to an eye/symptom log, also file it in the journal.
    if (photoUri && (type === "symptom" || type === "note")) {
      await PhotoRepo.insert({
        petId: activePet.id,
        uri: photoUri,
        category: type === "symptom" ? "other" : "other",
        note: note.trim() || (symptom || undefined),
        takenAt: loggedAt,
      });
    }

    bump();
    toast.show("Entry logged", "success");
    setBusy(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Log Today" subtitle={`for ${activePet.name}`} showBack />

      {/* Type selector — horizontal chip row (chrome, never wraps) */}
      <View style={{ height: 56, borderBottomWidth: 1, borderBottomColor: t.colors.divider }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: t.spacing.lg, gap: 8, alignItems: "center" }}
        >
          {TYPES.map((ty) => (
            <Chip key={ty.key} label={ty.label} icon={ty.icon} selected={type === ty.key} onPress={() => setType(ty.key)} testID={`logtype-${ty.key}`} />
          ))}
        </ScrollView>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={90}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {type === "weight" && (
          <FormField label="Weight" hint={`${template.label} goal: ${activePet.weightGoalGrams ?? "—"} g · ${template.weightUnitHint}`}>
            <AppTextInput testID="weight-input" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 480" suffix="g" autoFocus />
          </FormField>
        )}

        {type === "symptom" && (
          <>
            <FormField label="Symptom" hint="Pick a common one or type your own.">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {template.symptomPresets.map((s) => (
                  <Chip key={s} label={s} selected={symptom === s} onPress={() => { setSymptom(symptom === s ? "" : s); setCustomSymptom(""); }} testID={`symptom-${s}`} />
                ))}
              </View>
              <AppTextInput value={customSymptom} onChangeText={(v) => { setCustomSymptom(v); if (v) setSymptom(""); }} placeholder="Custom symptom…" />
            </FormField>
            <FormField label={`Severity · ${severity}/5`}>
              <Scale value={severity} onChange={setSeverity} testID="severity-scale" />
            </FormField>
            <FormField label={`Energy level · ${energy}/5`}>
              <Scale value={energy} onChange={setEnergy} testID="energy-scale" />
            </FormField>
          </>
        )}

        {type === "medication" && (
          <>
            <FormField label="Medication">
              {meds.filter((m) => m.active).length === 0 ? (
                <Card><Txt size={13} color={t.colors.onSurfaceSecondary}>No active medications. Add one in the Meds tab first.</Txt></Card>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {meds.filter((m) => m.active).map((m) => (
                    <Chip
                      key={m.id}
                      label={`${m.name} (${m.dosage}${m.unit})`}
                      selected={selectedMed?.id === m.id}
                      onPress={() => { setSelectedMed(m); setDoseGiven(`${m.dosage} ${m.unit}`); }}
                      testID={`medpick-${m.id}`}
                    />
                  ))}
                </View>
              )}
            </FormField>
            {selectedMed && (
              <>
                <FormField label="Dose given" hint="Precise volumes preserved exactly (e.g. 0.1 ml).">
                  <AppTextInput testID="dose-given-input" value={doseGiven} onChangeText={setDoseGiven} placeholder={`${selectedMed.dosage} ${selectedMed.unit}`} />
                </FormField>
                <FormField label="Time given">
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    <Chip label="Now" selected={doseTime === "now"} onPress={() => setDoseTime("now")} testID="dosetime-now" />
                    {selectedMed.times.map((tm) => (
                      <Chip key={tm} label={timeLabel(tm)} selected={doseTime === tm} onPress={() => setDoseTime(tm)} testID={`dosetime-${tm}`} />
                    ))}
                  </View>
                </FormField>
              </>
            )}
          </>
        )}

        {type === "husbandry" && (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <FormField label="Temp (°F)" style={{ flex: 1 }}>
              <AppTextInput testID="temp-input" value={tempF} onChangeText={setTempF} keyboardType="numeric" placeholder="102" suffix="°F" />
            </FormField>
            <FormField label="Humidity" style={{ flex: 1 }}>
              <AppTextInput testID="humidity-input" value={humidity} onChangeText={setHumidity} keyboardType="numeric" placeholder="35" suffix="%" />
            </FormField>
          </View>
        )}

        {/* Photo + note shared across all types */}
        <FormField label="Photo (optional)">
          {photoUri ? (
            <View style={{ position: "relative" }}>
              <Image source={{ uri: photoUri }} style={{ width: "100%", height: 200, borderRadius: t.radius.md }} contentFit="cover" />
              <Pressable
                testID="remove-photo"
                onPress={() => setPhotoUri(undefined)}
                style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}
              >
                <Feather name="x" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <AppButton title="Camera" icon="camera" variant="outline" onPress={() => attachPhoto("camera")} testID="log-camera" />
              <AppButton title="Gallery" icon="image" variant="outline" onPress={() => attachPhoto("library")} testID="log-gallery" />
            </View>
          )}
        </FormField>

        <FormField label="Notes (optional)">
          <AppTextInput testID="log-note-input" value={note} onChangeText={setNote} placeholder="Anything worth remembering…" multiline />
        </FormField>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={{ padding: t.spacing.lg, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: t.colors.divider, backgroundColor: t.colors.surface }}>
          <AppButton testID="save-log-button" title="Save Entry" icon="check" disabled={!canSave} loading={busy} onPress={save} />
        </View>
      </KeyboardStickyView>
    </View>
  );
}
