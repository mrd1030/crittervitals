import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { usePetData } from "@/src/hooks/usePetData";
import { Display, Txt, Card, AppButton, SectionHeader, Chip } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import { generateAndShareReport, ReportOptions } from "@/src/services/report";

import { Pet, Medication, LogEntry, Photo } from "@/src/models/types";
import { PetRepo, MedicationRepo, LogRepo, PhotoRepo } from "@/src/repositories";

export default function ReportScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { activePet } = useData();
  const { meds, logs, photos } = usePetData();

  const [rangeDays, setRangeDays] = useState(30);
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [busy, setBusy] = useState(false);

  const rangeOptions = [7, 14, 30, 60, 90];

  const handleGenerate = async () => {
    if (!activePet) {
      toast.show("No active pet selected", "error");
      return;
    }

    setBusy(true);
    try {
      const opts: ReportOptions = {
        rangeDays,
        includeWeight,
        includeMeds,
        includeSymptoms,
        includePhotos,
        includeLogs,
      };

      const result = await generateAndShareReport(activePet, meds, logs, photos, opts);

      if (result.ok) {
        toast.show("Report generated and shared", "success");
        router.back();
      } else {
        toast.show(result.error || "Failed to generate report", "error");
      }
    } catch (e) {
      toast.show("Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!activePet) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.surface, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <Txt>No active pet. Please select a pet first.</Txt>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
      >
        <Display size={26} style={{ marginBottom: t.spacing.lg }}>Vet Report</Display>

        <Txt size={14} color={t.colors.onSurfaceSecondary} style={{ marginBottom: t.spacing.xl, lineHeight: 22 }}>
          Generate a clean, professional PDF report with your pet’s recent health data. Perfect for vet visits.
        </Txt>

        {/* Time Range */}
        <SectionHeader title="Time Range" />
        <Card style={{ marginBottom: t.spacing.lg, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {rangeOptions.map((days) => (
            <Chip
              key={days}
              label={`${days} days`}
              selected={rangeDays === days}
              onPress={() => setRangeDays(days)}
            />
          ))}
        </Card>

        {/* Include Sections */}
        <SectionHeader title="Include in Report" />
        <Card style={{ marginBottom: t.spacing.lg }}>
          <ToggleRow
            label="Weight Trend & Chart"
            value={includeWeight}
            onToggle={setIncludeWeight}
          />
          <Divider style={{ marginVertical: t.spacing.md }} />
          <ToggleRow
            label="Current Medications & Adherence"
            value={includeMeds}
            onToggle={setIncludeMeds}
          />
          <Divider style={{ marginVertical: t.spacing.md }} />
          <ToggleRow
            label="Symptoms Observed"
            value={includeSymptoms}
            onToggle={setIncludeSymptoms}
          />
          <Divider style={{ marginVertical: t.spacing.md }} />
          <ToggleRow
            label="Recent Photos"
            value={includePhotos}
            onToggle={setIncludePhotos}
          />
          <Divider style={{ marginVertical: t.spacing.md }} />
          <ToggleRow
            label="Recent Activity Logs"
            value={includeLogs}
            onToggle={setIncludeLogs}
          />
        </Card>

        <Txt size={12} color={t.colors.onSurfaceTertiary} style={{ marginBottom: t.spacing.xl, textAlign: "center" }}>
          The report will include a clear disclaimer that this is a tracking tool only.
        </Txt>

        <AppButton
          title="Generate & Share PDF Report"
          icon="file-text"
          onPress={handleGenerate}
          busy={busy}
          fullWidth
        />
      </ScrollView>
    </View>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => onToggle(!value)}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}
    >
      <Txt size={15} style={{ flex: 1 }}>{label}</Txt>
      <View
        style={{
          width: 50,
          height: 28,
          borderRadius: 14,
          backgroundColor: value ? t.colors.brandPrimary : t.colors.surfaceTertiary,
          padding: 3,
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#fff",
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </Pressable>
  );
}
