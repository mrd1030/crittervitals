import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { usePetData } from "@/src/hooks/usePetData";
import { Display, Txt, Card, AppButton, Badge, Divider, EmptyState } from "@/src/components/ui";
import { Header } from "@/src/components/Header";
import { computeAdherence } from "@/src/services/trends";
import { timeLabel } from "@/src/utils/format";

export default function MedicationsScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activePet, meds, logs, loading } = usePetData();

  const adherence = computeAdherence(logs, meds, 14);
  const rateFor = (id: string) => adherence.perMed.find((m) => m.name && meds.find((mm) => mm.id === id)?.name === m.name);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Medications" subtitle={activePet ? `${activePet.name} · adherence ${adherence.expected ? Math.round(adherence.rate * 100) + "%" : "—"} (14d)` : undefined} />

      {!loading && meds.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            testID="meds-empty"
            icon="clock"
            title="No medications yet"
            subtitle="Add a medication to schedule reminders and track adherence with precise dosing."
            actionLabel="Add Medication"
            onAction={() => router.push("/medication-edit")}
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 120 + insets.bottom }}>
          {meds.map((m) => {
            const adh = rateFor(m.id);
            return (
              <Card key={m.id} testID={`med-card-${m.id}`} onPress={() => router.push(`/medication-edit?id=${m.id}`)} style={{ marginBottom: t.spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Display size={18}>{m.name}</Display>
                      {!m.active && <Badge label="Paused" tone="neutral" />}
                    </View>
                    <Txt size={14} weight="700" color={t.colors.brandPrimary} style={{ marginTop: 4 }}>
                      {m.dosage} {m.unit} · {m.route}
                    </Txt>
                  </View>
                  <Feather name="chevron-right" size={20} color={t.colors.onSurfaceTertiary} />
                </View>

                <Divider style={{ marginVertical: t.spacing.md }} />

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="clock" size={14} color={t.colors.onSurfaceTertiary} />
                    <Txt size={12} color={t.colors.onSurfaceSecondary}>
                      {m.frequencyPerDay}× daily · {m.times.map(timeLabel).join(", ")}
                    </Txt>
                  </View>
                  {adh && m.active && (
                    <Txt size={12} weight="700" color={adh.rate >= 0.8 ? t.colors.success : t.colors.brandSecondary}>
                      {Math.round(adh.rate * 100)}%
                    </Txt>
                  )}
                </View>
                {m.notes ? <Txt size={12} color={t.colors.onSurfaceTertiary} style={{ marginTop: 8 }}>{m.notes}</Txt> : null}
              </Card>
            );
          })}
        </ScrollView>
      )}

      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.md, paddingBottom: insets.bottom + 10, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.divider }}>
        <AppButton testID="add-medication-button" title="Add Medication" icon="plus" onPress={() => router.push("/medication-edit")} />
      </View>
    </View>
  );
}
