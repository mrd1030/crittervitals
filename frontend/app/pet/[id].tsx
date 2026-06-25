import React, { useCallback, useState } from "react";
import { View, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { Display, Txt, Card, Badge, SectionHeader, Divider, AppButton, StatTile } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { PetRepo, MedicationRepo, LogRepo } from "@/src/repositories";
import { Pet, Medication, LogEntry } from "@/src/models/types";
import { SPECIES_TEMPLATES } from "@/src/constants/species";
import { latestWeight, weightDelta, computeAdherence } from "@/src/services/trends";
import { formatWeight, relativeTime, LOG_META } from "@/src/utils/format";
import { pickPhoto } from "@/src/services/photos";

export default function PetProfile() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { width } = useWindowDimensions();
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
        <Pressable onPress={() => router.back()} hitSlop={10}><Feather name="chevron-left" size={28} color={t.colors.onSurface} /></Pressable>
        <Txt style={{ marginTop: 20 }}>Loading…</Txt>
      </View>
    );
  }

  const template = SPECIES_TEMPLATES[pet.species];
  const lw = latestWeight(logs);
  const delta = weightDelta(logs, 7);
  const adherence = computeAdherence(logs, meds, 14);
  const isActive = activePet?.id === pet.id;
  const heroH = Math.min(width * 0.82, 360);

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
        {/* Hero with mandatory dark scrim behind the name */}
        <View style={{ height: heroH }}>
          {pet.photoUri ? (
            <Image source={{ uri: pet.photoUri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, backgroundColor: t.colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
              <Txt size={72}>{template.emoji}</Txt>
            </View>
          )}
          <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.75)"]} style={{ position: "absolute", inset: 0 }} />
          <View style={{ position: "absolute", top: insets.top + 6, left: t.spacing.lg, right: t.spacing.lg, flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable testID="profile-back" onPress={() => router.back()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="chevron-left" size={26} color="#fff" />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable testID="profile-change-photo" onPress={changePhoto} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="camera" size={20} color="#fff" />
              </Pressable>
              <Pressable testID="profile-edit" onPress={() => router.push(`/add-pet?id=${pet.id}`)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="edit-2" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
          <View style={{ position: "absolute", left: t.spacing.lg, right: t.spacing.lg, bottom: t.spacing.lg }}>
            {isActive && <View style={{ alignSelf: "flex-start", marginBottom: 8 }}><Badge label="Active pet" tone="success" /></View>}
            <Display size={34} color="#FFFFFF">{pet.name}</Display>
            <Txt size={14} color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>
              {template.emoji} {template.label}{pet.morph ? ` · ${pet.morph}` : ""}
            </Txt>
          </View>
        </View>

        <View style={{ padding: t.spacing.lg }}>
          {/* Quick actions */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: t.spacing.lg }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Log" icon="plus-circle" onPress={() => { if (!isActive) setActivePet(pet.id); router.push("/log"); }} testID="profile-log" />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Vet Report" icon="file-text" variant="outline" onPress={() => { if (!isActive) setActivePet(pet.id); router.push("/report"); }} testID="profile-report" />
            </View>
          </View>
          {!isActive && (
            <AppButton title="Make Active Pet" icon="check-circle" variant="ghost" onPress={makeActive} style={{ marginBottom: t.spacing.md }} testID="profile-make-active" />
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

          {pet.notes ? (
            <Card style={{ marginBottom: t.spacing.lg }}>
              <Txt size={13} color={t.colors.onSurfaceSecondary} style={{ lineHeight: 20 }}>{pet.notes}</Txt>
            </Card>
          ) : null}

          {/* Current medications */}
          <SectionHeader title="Current Medications" actionLabel="Manage" onAction={() => { if (!isActive) setActivePet(pet.id); router.push("/(tabs)/medications"); }} />
          {meds.filter((m) => m.active).length === 0 ? (
            <Card style={{ marginBottom: t.spacing.lg }}><Txt size={13} color={t.colors.onSurfaceSecondary}>No active medications.</Txt></Card>
          ) : (
            <Card style={{ padding: 0, marginBottom: t.spacing.lg }}>
              {meds.filter((m) => m.active).map((m, i) => (
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
                  </View>
                );
              })}
            </Card>
          )}

          {/* Danger zone */}
          {pets.length > 1 && (
            <AppButton title="Delete Pet" icon="trash-2" variant="ghost" onPress={deletePet} fullWidth={false} style={{ alignSelf: "center", marginTop: t.spacing.xl }} testID="profile-delete" />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
