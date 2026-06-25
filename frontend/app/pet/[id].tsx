import React, { useCallback, useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { useToast } from "@/src/components/Toast";
import { PetRepo, MedicationRepo, LogRepo } from "@/src/repositories";
import { Pet, Medication, LogEntry } from "@/src/models/types";
import { SPECIES_TEMPLATES } from "@/src/constants/species";
import { latestWeight, weightDelta, computeAdherence } from "@/src/services/trends";
import { formatWeight } from "@/src/utils/format";
import { pickPhoto } from "@/src/services/photos";

import { PetHero } from "@/src/components/pet/PetHero";
import { PetQuickActions } from "@/src/components/pet/PetQuickActions";
import { Display, Txt, Card, Badge, SectionHeader, Divider, AppButton, StatTile } from "@/src/components/ui";

export default function PetProfile() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activePet, setActivePet, bump, pets, refresh } = useData();

  const [pet, setPet] = useState<Pet | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const p = await PetRepo.getById(id);
    setPet(p ?? null);
    setMeds(await MedicationRepo.getByPet(id));
    setLogs(await LogRepo.getByPet(id, 20));
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!pet) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.surface, paddingTop: insets.top + 40, paddingHorizontal: 20 }}>
        <Txt style={{ marginTop: 20 }}>Loading…</Txt>
      </View>
    );
  }

  const template = SPECIES_TEMPLATES[pet.species];
  const lw = latestWeight(logs);
  const delta = weightDelta(logs, 7);
  const adherence = computeAdherence(logs, meds, 14);
  const isActive = activePet?.id === pet.id;
  const activeMeds = meds.filter((m) => m.active);

  const changePhoto = async () => {
    const res = await pickPhoto();
    if (res.ok) {
      await PetRepo.update(pet.id, { photoUri: res.uri });
      await refresh();
      load();
      toast.show("Profile photo updated", "success");
    } else if (res.reason === "blocked") {
      toast.show("Enable photo access in Settings", "error");
    }
  };

  const makeActive = async () => {
    await setActivePet(pet.id);
    toast.show(`${pet.name} is now active`, "success");
  };

  const goHome = () => router.replace("/(tabs)");

  // NEW FEATURE: Mark all today's medications as taken
  const markAllMedsToday = async () => {
    if (!activePet) return;
    for (const med of activeMeds) {
      await LogRepo.insert({
        petId: activePet.id,
        type: "medication",
        loggedAt: new Date().toISOString(),
        medicationId: med.id,
        medicationName: med.name,
        dosageGiven: `${med.dosage} ${med.unit}`,
      });
    }
    toast.show(`Marked ${activeMeds.length} medications as taken`, "success");
    bump();
    load();
  };

  const deletePet = async () => {
    await PetRepo.remove(pet.id);
    await refresh();
    bump();
    toast.show(`${pet.name} removed`, "info");
    router.replace("/(tabs)");
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PetHero
          pet={pet}
          onBack={() => router.back()}
          onChangePhoto={changePhoto}
          onEdit={() => router.push(`/add-pet?id=${pet.id}`)}
        />

        <View style={{ padding: t.spacing.lg }}>
          <PetQuickActions
            onLog={() => { if (!isActive) setActivePet(pet.id); router.push("/log"); }}
            onVetReport={() => { if (!isActive) setActivePet(pet.id); router.push("/report"); }}
            onBackToHome={goHome}
            onMarkAllMeds={markAllMedsToday}
            hasActiveMeds={activeMeds.length > 0}
            activeMedCount={activeMeds.length}
          />

          {!isActive && (
            <AppButton title="Make Active Pet" icon="check-circle" variant="ghost" onPress={makeActive} style={{ marginBottom: t.spacing.md }} />
          )}

          {/* Health metrics */}
          <Card style={{ marginBottom: t.spacing.lg }}>
            <View style={{ flexDirection: "row" }}>
              <StatTile label="Latest weight" value={formatWeight(lw, "g")} sub={delta != null ? `${delta >= 0 ? "+" : ""}${delta}g /7d` : undefined} icon="trending-up" />
              <StatTile label="Goal" value={pet.weightGoalGrams ? `${pet.weightGoalGrams} g` : "—"} icon="target" />
              <StatTile label="Adherence" value={adherence.expected ? `${Math.round(adherence.rate * 100)}%` : "—"} sub="14 days" icon="check-circle" />
            </View>
          </Card>

          {/* Conditions */}
          {pet.chronicConditions.length > 0 && (
            <>
              <SectionHeader title="Monitoring" />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: t.spacing.lg }}>
                {pet.chronicConditions.map((c) => <Badge key={c} label={c} tone="brand" />)}
              </View>
            </>
          )}

          {pet.notes ? <Card style={{ marginBottom: t.spacing.lg }}><Txt size={13} color={t.colors.onSurfaceSecondary} style={{ lineHeight: 20 }}>{pet.notes}</Txt></Card> : null}

          {/* Current medications */}
          <SectionHeader title="Current Medications" actionLabel="Manage" onAction={() => { if (!isActive) setActivePet(pet.id); router.push("/(tabs)/medications"); }} />
          {activeMeds.length === 0 ? (
            <Card style={{ marginBottom: t.spacing.lg }}><Txt size={13} color={t.colors.onSurfaceSecondary}>No active medications.</Txt></Card>
          ) : (
            <Card style={{ padding: 0, marginBottom: t.spacing.lg }}>
              {activeMeds.map((m, i) => (
                <View key={m.id}>
                  {i > 0 && <Divider style={{ marginHorizontal: t.spacing.lg }} />}
                  <View style={{ flexDirection: "row", alignItems: "center", padding: t.spacing.lg, gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                      <Feather name="clock" size={17} color={t.colors.brandPrimary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={15} weight="700">{m.name}</Txt>
                      <Txt size={12} color={t.colors.onSurfaceSecondary} style={{ marginTop: 1 }}>{m.dosage} {m.unit} · {m.frequencyPerDay}× daily</Txt>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Care tips */}
          <SectionHeader title="Care Tips" />
          <Card style={{ marginBottom: t.spacing.lg, gap: 12 }}>
            {template.careTips.map((tip, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <Feather name="check" size={16} color={t.colors.brandPrimary} style={{ marginTop: 2 }} />
                <Txt size={13} color={t.colors.onSurfaceSecondary} style={{ flex: 1, lineHeight: 19 }}>{tip}</Txt>
              </View>
            ))}
          </Card>

          {/* Recent activity */}
          <SectionHeader title="Recent Activity" />
          {logs.length === 0 ? (
            <Card><Txt size={13} color={t.colors.onSurfaceSecondary}>No activity yet.</Txt></Card>
          ) : (
            <Card style={{ padding: 0 }}>
              {logs.slice(0, 8).map((l, i) => {
                const meta = LOG_META[l.type];
                let detail = "";
                if (l.type === "weight") detail = formatWeight(l.weightGrams, "g");
                else if (l.type === "medication") detail = `${l.medicationName} · ${l.dosageGiven}`;
                else if (l.type === "symptom") detail = `${l.symptom}${l.severity ? ` (sev ${l.severity}/5)` : ""}`;
                else if (l.type === "husbandry") detail = `${l.tempF ?? "—"}°F · ${l.humidity ?? "—"}%`;
                else detail = l.note || "Note";
                return (
                  <View key={l.id}>
                    {i > 0 && <Divider style={{ marginHorizontal: t.spacing.lg }} />}
                    <View style={{ flexDirection: "row", alignItems: "center", padding: t.spacing.lg, gap: 12 }}>
                      <Feather name={meta.icon as keyof typeof Feather.glyphMap} size={18} color={meta.color} />
                      <View style={{ flex: 1 }}>
                        <Txt size={14} weight="600">{meta.label}</Txt>
                        <Txt size={12} color={t.colors.onSurfaceSecondary} numberOfLines={1}>{detail}</Txt>
                      </View>
                      <Txt size={11} color={t.colors.onSurfaceTertiary}>{relativeTime(l.loggedAt)}</Txt>
                    </View>
                );
              })}
            </Card>
          )}

          {pets.length > 1 && (
            <AppButton title="Delete Pet" icon="trash-2" variant="ghost" onPress={deletePet} fullWidth={false} style={{ alignSelf: "center", marginTop: t.spacing.xl }} />
          )}
        </View>
      </ScrollView>
    </View>
   </View>
  );
}
