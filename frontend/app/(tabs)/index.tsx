import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { usePetData, computeTodaysDoses } from "@/src/hooks/usePetData";
import { Display, Txt, Card, AppButton, Badge, SectionHeader, Divider, EmptyState, StatTile } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { LogRepo } from "@/src/repositories";
import { latestWeight, weightDelta, computeAdherence, buildInsights } from "@/src/services/trends";
import { formatWeight, relativeTime, timeLabel, LOG_META } from "@/src/utils/format";
import { SPECIES_TEMPLATES } from "@/src/constants/species";
import { LogEntry } from "@/src/models/types";

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { weightUnit, bump, pets, setActivePet } = useData();
  const { activePet, meds, logs, loading, reload } = usePetData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  if (!loading && !activePet) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.surface, paddingTop: insets.top }}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            testID="dashboard-empty"
            imageUri="https://images.pexels.com/photos/185500/pexels-photo-185500.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            title="Welcome to CritterVitals"
            subtitle="Add your first pet to begin tracking weight, medications, symptoms and photos."
            actionLabel="Add a Pet"
            onAction={() => router.push("/add-pet")}
          />
        </View>
      </View>
    );
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const doses = computeTodaysDoses(meds, logs);
  const pendingDoses = doses.filter((d) => !d.taken);
  const lw = latestWeight(logs);
  const delta = weightDelta(logs, 7);
  const adherence = computeAdherence(logs, meds, 7);
  const insights = buildInsights(logs, meds);
  const recent = logs.slice(0, 5);
  const template = activePet ? SPECIES_TEMPLATES[activePet.species] : null;

  const markDose = async (medId: string, medName: string, dosage: string, unit: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await LogRepo.insert({
      petId: activePet!.id,
      type: "medication",
      loggedAt: new Date().toISOString(),
      medicationId: medId,
      medicationName: medName,
      dosageGiven: `${dosage} ${unit}`,
    });
    toast.show(`${medName} logged`, "success");
    bump();
    reload();
  };

  const switchPet = () => {
    if (pets.length > 1) {
      const currentIndex = pets.findIndex(p => p.id === activePet?.id);
      const nextIndex = (currentIndex + 1) % pets.length;
      setActivePet(pets[nextIndex].id);
      Haptics.selectionAsync().catch(() => {});
    } else {
      router.push("/add-pet");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      {/* Sticky header with pet identity + settings */}
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.sm, backgroundColor: t.colors.surface }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            testID="dashboard-pet-header"
            onPress={switchPet}
            style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}
          >
            {activePet?.photoUri ? (
              <Image source={{ uri: activePet.photoUri }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: t.colors.brandTertiary, alignItems: "center", justifyContent: "center" }}>
                <Txt size={24}>{template?.emoji}</Txt>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Txt size={12} color={t.colors.onSurfaceTertiary}>{today}</Txt>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Display size={22}>{activePet?.name}</Display>
                {pets.length > 1 && <Feather name="chevron-down" size={18} color={t.colors.onSurfaceTertiary} />}
              </View>
              {pets.length > 1 && (
                <Txt size={11} color={t.colors.brandPrimary}>Tap to switch pet</Txt>
              )}
            </View>
          </Pressable>
          <Pressable
            testID="dashboard-settings-button"
            onPress={() => router.push("/settings")}
            hitSlop={8}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.surfaceSecondary }}
          >
            <Feather name="settings" size={20} color={t.colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: t.spacing.sm, paddingBottom: 130 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.brandPrimary} />}
      >
        {/* Daily summary stat strip */}
        <Card style={{ marginBottom: t.spacing.lg }}>
          <View style={{ flexDirection: "row" }}>
            <StatTile
              icon="trending-up"
              label="Latest weight"
              value={formatWeight(lw, weightUnit)}
              sub={delta != null ? `${delta >= 0 ? "+" : ""}${delta}g / 7d` : "No trend yet"}
            />
            <StatTile
              icon="check-circle"
              label="Adherence 7d"
              value={adherence.expected ? `${Math.round(adherence.rate * 100)}%` : "—"}
              sub={adherence.expected ? `${adherence.taken}/${adherence.expected} doses` : "No meds"}
            />
            <StatTile
              icon="clock"
              label="Doses due"
              value={String(pendingDoses.length)}
              sub={pendingDoses.length === 0 ? "All done!" : "remaining today"}
              tone={pendingDoses.length > 0 ? t.colors.brandSecondary : t.colors.success}
            />
          </View>
        </Card>

        {/* Conditions */}
        {activePet && activePet.chronicConditions.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: t.spacing.lg }}>
            {activePet.chronicConditions.map((c) => (
              <Badge key={c} label={c} tone="brand" />
            ))}
          </View>
        )}

        {/* Today's medications */}
        <SectionHeader title="Today's Medications" actionLabel="Manage" onAction={() => router.push("/(tabs)/medications")} />
        {doses.length === 0 ? (
          <Card style={{ marginBottom: t.spacing.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Feather name="clock" size={20} color={t.colors.onSurfaceTertiary} />
              <Txt size={14} color={t.colors.onSurfaceSecondary} style={{ flex: 1 }}>
                No medications scheduled. Add one to start adherence tracking.
              </Txt>
            </View>
          </Card>
        ) : (
          <Card style={{ marginBottom: t.spacing.lg, padding: 0 }}>
            {doses.map((d, i) => (
              <View key={`${d.med.id}-${d.time}`}>
                {i > 0 && <Divider style={{ marginHorizontal: t.spacing.lg }} />}
                <Pressable
                  testID={`dose-${d.med.id}-${d.time}`}
                  disabled={d.taken}
                  onPress={() => markDose(d.med.id, d.med.name, d.med.dosage, d.med.unit)}
                  style={{ flexDirection: "row", alignItems: "center", padding: t.spacing.lg, gap: 12, opacity: d.taken ? 0.6 : 1 }}
                >
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: d.taken ? t.colors.brandPrimary : t.colors.surfaceSecondary,
                      borderWidth: d.taken ? 0 : 1.5, borderColor: t.colors.borderStrong,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Feather name={d.taken ? "check" : "circle"} size={d.taken ? 20 : 14} color={d.taken ? t.colors.onBrandPrimary : t.colors.onSurfaceTertiary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={15} weight="700" style={{ textDecorationLine: d.taken ? "line-through" : "none" }}>
                      {d.med.name}
                    </Txt>
                    <Txt size={12} color={t.colors.onSurfaceSecondary} style={{ marginTop: 2 }}>
                      {d.med.dosage} {d.med.unit} · {timeLabel(d.time)}
                    </Txt>
                  </View>
                  {!d.taken && (
                    <Txt size={12} weight="700" color={t.colors.brandPrimary}>
                      Mark taken
                    </Txt>
                  )}
                </Pressable>
              </View>
            ))}
          </Card>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <>
            <SectionHeader title="Insights" />
            <Card style={{ marginBottom: t.spacing.lg, gap: 12 }}>
              {insights.map((ins, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <Feather name="zap" size={16} color={t.colors.brandSecondary} style={{ marginTop: 2 }} />
                  <Txt size={14} color={t.colors.onSurfaceSecondary} style={{ flex: 1, lineHeight: 20 }}>{ins}</Txt>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Recent activity */}
        <SectionHeader title="Recent Activity" actionLabel={logs.length ? "View all" : undefined} onAction={() => activePet && router.push(`/pet/${activePet.id}`)} />
        {recent.length === 0 ? (
          <Card>
            <Txt size={14} color={t.colors.onSurfaceSecondary}>No logs yet. Tap “Log Today” to record your first entry.</Txt>
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            {recent.map((l, i) => (
              <View key={l.id}>
                {i > 0 && <Divider style={{ marginHorizontal: t.spacing.lg }} />}
                <ActivityRow log={l} weightUnit={weightUnit} />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Sticky "Log Today" — primary CTA pinned above the tab bar */}
      <View
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.md,
          paddingBottom: insets.bottom + 10,
          backgroundColor: t.colors.surface,
          borderTopWidth: 1, borderTopColor: t.colors.divider,
        }}
      >
        <AppButton testID="log-today-button" title="Log Today" icon="plus-circle" onPress={() => router.push("/log")} />
      </View>
    </View>
  );
}

function ActivityRow({ log, weightUnit }: { log: LogEntry; weightUnit: "g" | "kg" }) {
  const t = useTheme();
  const meta = LOG_META[log.type];
  let detail = "";
  if (log.type === "weight") detail = formatWeight(log.weightGrams, weightUnit);
  else if (log.type === "medication") detail = `${log.medicationName} · ${log.dosageGiven}`;
  else if (log.type === "symptom") detail = `${log.symptom}${log.severity ? ` (sev ${log.severity}/5)` : ""}`;
  else if (log.type === "husbandry") detail = `${log.tempF ?? "—"}°F · ${log.humidity ?? "—"}% RH`;
  else detail = log.note || "Note";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: t.spacing.lg, gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
        <Feather name={meta.icon as keyof typeof Feather.glyphMap} size={17} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={14} weight="600">{meta.label}</Txt>
        <Txt size={12} color={t.colors.onSurfaceSecondary} numberOfLines={1} style={{ marginTop: 1 }}>{detail}</Txt>
      </View>
      <Txt size={11} color={t.colors.onSurfaceTertiary}>{relativeTime(log.loggedAt)}</Txt>
    </View>
  );
}
