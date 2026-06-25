import React from "react";
import { View } from "react-native";
import { AppButton } from "@/src/components/ui";

interface PetQuickActionsProps {
  onLog: () => void;
  onVetReport: () => void;
  onBackToHome: () => void;
  onMarkAllMeds?: () => void;
  hasActiveMeds: boolean;
  activeMedCount: number;
}

export function PetQuickActions({
  onLog,
  onVetReport,
  onBackToHome,
  onMarkAllMeds,
  hasActiveMeds,
  activeMedCount,
}: PetQuickActionsProps) {
  return (
    <View style={{ gap: 10, marginBottom: 20 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <AppButton title="Log" icon="plus-circle" onPress={onLog} />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton title="Vet Report" icon="file-text" variant="outline" onPress={onVetReport} />
        </View>
      </View>

      <AppButton title="Back to Home" icon="home" variant="ghost" onPress={onBackToHome} />

      {hasActiveMeds && onMarkAllMeds && (
        <AppButton
          title={`Mark All ${activeMedCount} Meds as Taken`}
          icon="check-circle"
          onPress={onMarkAllMeds}
        />
      )}
    </View>
  );
}
