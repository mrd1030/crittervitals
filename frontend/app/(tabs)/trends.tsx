import React, { useState } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { usePetData } from "@/src/hooks/usePetData";
import { Display, Txt, Card, Chip, SectionHeader, EmptyState, Divider } from "@/src/components/ui";
import { Header } from "@/src/components/Header";
import { buildWeightSeries, computeAdherence, symptomFrequency, buildInsights } from "@/src/services/trends";
import { formatWeight } from "@/src/utils/format";

const RANGES = [
  { key: 14, label: "14 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
];

export default function TrendsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { weightUnit } = useData();
  const { activePet, meds, logs, loading } = usePetData();
  const [range, setRange] = useState(30);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - range);
  const cutoffIso = cutoff.toISOString();
  const rangedLogs = logs.filter((l) => l.loggedAt >= cutoffIso);

  const series = buildWeightSeries(rangedLogs);
  const goal = activePet?.weightGoalGrams ?? null;
  const adherence = computeAdherence(logs, meds, range);
  const symptoms = symptomFrequency(logs, range);
  const insights = buildInsights(logs, meds);

  const chartW = width - t.spacing.lg * 2 - t.spacing.lg * 2;

  if (!loading && logs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
        <Header title="Trends" />
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState icon="trending-up" title="Not enough data yet" subtitle="Log weight for a few days to see trends and insights appear here." />
        </View>
      </View>
    );
  }

  // Weight line data + a dashed goal line as a second dataset.
  const lineData = series.map((s) => ({ value: s.value, label: s.label }));
  const values = series.map((s) => s.value);
  const minV = values.length ? Math.min(...values, goal ?? Infinity) : 0;
  const maxV = values.length ? Math.max(...values, goal ?? -Infinity) : 100;
  const yOffset = Math.max(0, Math.floor(minV - 15));
  const goalData = goal != null ? series.map(() => ({ value: goal })) : [];
  const spacing = series.length > 1 ? Math.max(28, chartW / (series.length - 1)) : 40;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Trends" subtitle={activePet?.name} />

      {/* Range filter — horizontal chip row */}
      <View style={{ height: 56, borderBottomWidth: 1, borderBottomColor: t.colors.divider }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.lg, gap: 8, alignItems: "center" }}>
          {RANGES.map((r) => (
            <Chip key={r.key} label={r.label} selected={range === r.key} onPress={() => setRange(r.key)} testID={`range-${r.key}`} />
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 40 + insets.bottom }}>
        {insights.length > 0 && (
          <Card style={{ marginBottom: t.spacing.lg, gap: 12, backgroundColor: t.colors.brandTertiary, borderColor: t.colors.brandTertiary }}>
            {insights.map((ins, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                <Feather name="zap" size={16} color={t.colors.brandPrimary} style={{ marginTop: 2 }} />
                <Txt size={14} color={t.colors.onBrandTertiary} style={{ flex: 1, lineHeight: 20 }}>{ins}</Txt>
              </View>
            ))}
          </Card>
        )}

        {/* Weight chart */}
        <SectionHeader title="Weight Trend" />
        <Card style={{ marginBottom: t.spacing.lg }}>
          {series.length < 2 ? (
            <Txt size={13} color={t.colors.onSurfaceSecondary}>Log weight on at least two days to see a trend line.</Txt>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: t.spacing.md }}>
                <View>
                  <Txt size={12} color={t.colors.onSurfaceTertiary}>Latest</Txt>
                  <Display size={24}>{formatWeight(values[values.length - 1], weightUnit)}</Display>
                </View>
                {goal != null && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 16, height: 0, borderTopWidth: 2, borderColor: t.colors.brandSecondary, borderStyle: "dashed" }} />
                    <Txt size={12} color={t.colors.onSurfaceSecondary}>Goal {goal}g</Txt>
                  </View>
                )}
              </View>
              <LineChart
                data={lineData}
                data2={goalData}
                height={180}
                width={chartW}
                spacing={spacing}
                initialSpacing={16}
                endSpacing={10}
                thickness={3}
                color={t.colors.brandPrimary}
                color2={t.colors.brandSecondary}
                dataPointsColor={t.colors.brandPrimary}
                hideDataPoints2
                strokeDashArray2={[5, 5]}
                yAxisOffset={yOffset}
                maxValue={Math.ceil(maxV + 15 - yOffset)}
                noOfSections={4}
                rulesColor={t.colors.divider}
                yAxisColor="transparent"
                xAxisColor={t.colors.border}
                yAxisTextStyle={{ color: t.colors.onSurfaceTertiary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: t.colors.onSurfaceTertiary, fontSize: 9 }}
                curved
                areaChart
                startFillColor={t.colors.brandPrimary}
                startOpacity={0.18}
                endOpacity={0.01}
              />
            </>
          )}
        </Card>

        {/* Adherence */}
        <SectionHeader title="Medication Adherence" />
        <Card style={{ marginBottom: t.spacing.lg }}>
          {adherence.perMed.length === 0 ? (
            <Txt size={13} color={t.colors.onSurfaceSecondary}>No active medications to track.</Txt>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: t.spacing.md }}>
                <Display size={28}>{Math.round(adherence.rate * 100)}%</Display>
                <Txt size={13} color={t.colors.onSurfaceSecondary}>overall · {adherence.taken}/{adherence.expected} doses</Txt>
              </View>
              {adherence.perMed.map((m, i) => (
                <View key={m.name}>
                  {i > 0 && <Divider style={{ marginVertical: t.spacing.md }} />}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <Txt size={14} weight="700">{m.name}</Txt>
                    <Txt size={13} weight="700" color={m.rate >= 0.8 ? t.colors.success : t.colors.brandSecondary}>{Math.round(m.rate * 100)}%</Txt>
                  </View>
                  <View style={{ height: 10, borderRadius: 5, backgroundColor: t.colors.surfaceSecondary, overflow: "hidden" }}>
                    <View style={{ width: `${Math.round(m.rate * 100)}%`, height: "100%", borderRadius: 5, backgroundColor: m.rate >= 0.8 ? t.colors.brandPrimary : t.colors.brandSecondary }} />
                  </View>
                </View>
              ))}
            </>
          )}
        </Card>

        {/* Symptoms */}
        <SectionHeader title="Symptom Frequency" />
        <Card>
          {symptoms.length === 0 ? (
            <Txt size={13} color={t.colors.onSurfaceSecondary}>No symptoms logged in this period — that's good news.</Txt>
          ) : (
            <BarChart
              data={symptoms.slice(0, 6).map((s) => ({
                value: s.count,
                label: s.symptom.length > 8 ? s.symptom.slice(0, 7) + "…" : s.symptom,
                frontColor: t.colors.brandSecondary,
              }))}
              height={150}
              width={chartW}
              barWidth={26}
              spacing={18}
              initialSpacing={14}
              roundedTop
              noOfSections={3}
              rulesColor={t.colors.divider}
              yAxisColor="transparent"
              xAxisColor={t.colors.border}
              yAxisTextStyle={{ color: t.colors.onSurfaceTertiary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: t.colors.onSurfaceTertiary, fontSize: 9 }}
            />
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
