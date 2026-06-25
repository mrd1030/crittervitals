import React, { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { Display, Txt, Card, AppButton, SectionHeader, Badge } from "@/src/components/ui";
import { useToast } from "@/src/components/Toast";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { PetRepo, MedicationRepo, LogRepo, PhotoRepo } from "@/src/repositories";
import { requestNotificationPermission, getPermissionStatus } from "@/src/services/reminders";
import { Header } from "@/src/components/Header";

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { weightUnit, setWeightUnit, refresh, clearAllData } = useData();

  const [notifStatus, setNotifStatus] = useState<"granted" | "denied" | "undetermined" | "unavailable">("undetermined");
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    getPermissionStatus().then(setNotifStatus);
  }, []);

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    const status = await getPermissionStatus();
    setNotifStatus(status);
    if (granted) {
      toast.show("Notifications enabled", "success");
    } else {
      toast.show("Please enable notifications in system settings", "error");
    }
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const pets = await PetRepo.getAll();
      const meds = await MedicationRepo.getAll();
      const logs = await LogRepo.getAll();
      const photos = await PhotoRepo.getAll();

      const exportData = {
        exportedAt: new Date().toISOString(),
        pets,
        medications: meds,
        logs,
        photos,
      };

      const fileUri = FileSystem.cacheDirectory + "crittervitals-export.json";
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "CritterVitals Data Export",
        });
      } else {
        toast.show("Export saved to cache", "success");
      }
    } catch (e) {
      toast.show("Export failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Delete All Data?",
      "This will permanently delete all pets, medications, logs, and photos. You will be taken back to the onboarding screen. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            await clearAllData();
            await refresh();
            toast.show("All data cleared", "info");
            setBusy(false);
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Settings" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: t.spacing.md, paddingBottom: insets.bottom + 40 }}
      >
        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <Card style={{ marginBottom: t.spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="700">Medication Reminders</Txt>
              <Txt size={13} color={t.colors.onSurfaceSecondary} style={{ marginTop: 4 }}>
                Daily reminders for scheduled medications
              </Txt>
            </View>
            {notifStatus === "granted" ? (
              <Badge label="Enabled" tone="success" />
            ) : (
              <AppButton title="Enable" size="small" onPress={enableNotifications} />
            )}
          </View>
        </Card>

        {/* Units */}
        <SectionHeader title="Units" />
        <Card style={{ marginBottom: t.spacing.lg, flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => setWeightUnit("g")}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: weightUnit === "g" ? t.colors.brandPrimary : t.colors.surfaceSecondary,
              alignItems: "center",
            }}
          >
            <Txt weight="700" color={weightUnit === "g" ? t.colors.onBrandPrimary : t.colors.onSurface}>
              Grams (g)
            </Txt>
          </Pressable>
          <Pressable
            onPress={() => setWeightUnit("kg")}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: 12,
              backgroundColor: weightUnit === "kg" ? t.colors.brandPrimary : t.colors.surfaceSecondary,
              alignItems: "center",
            }}
          >
            <Txt weight="700" color={weightUnit === "kg" ? t.colors.onBrandPrimary : t.colors.onSurface}>
              Kilograms (kg)
            </Txt>
          </Pressable>
        </Card>

        {/* Data */}
        <SectionHeader title="Data" />
        <Card style={{ marginBottom: t.spacing.lg }}>
          <AppButton
            title="Export All Data (JSON)"
            icon="download"
            variant="outline"
            onPress={exportData}
            busy={busy}
            fullWidth
          />
          <Txt size={12} color={t.colors.onSurfaceTertiary} style={{ marginTop: 8, textAlign: "center" }}>
            Includes pets, medications, logs, and photos
          </Txt>
        </Card>

        {/* Disclaimer */}
        <Card style={{ marginBottom: t.spacing.lg, backgroundColor: t.colors.brandTertiary, borderColor: t.colors.brandTertiary }}>
          <Txt size={13} weight="700" color={t.colors.onBrandTertiary}>
            Important Disclaimer
          </Txt>
          <Txt size={13} color={t.colors.onBrandTertiary} style={{ marginTop: 8, lineHeight: 20 }}>
            CritterVitals is a personal tracking tool only. It does not provide veterinary or medical advice. 
            Always consult a qualified exotic animal veterinarian for health concerns, diagnoses, or treatment.
          </Txt>
        </Card>

        {/* About */}
        <SectionHeader title="About" />
        <Card style={{ marginBottom: t.spacing.xl }}>
          <Txt size={14} weight="700">CritterVitals</Txt>
          <Txt size={13} color={t.colors.onSurfaceSecondary} style={{ marginTop: 4 }}>
            Proactive care tracking for exotic pets • v1.0
          </Txt>
          <Txt size={12} color={t.colors.onSurfaceTertiary} style={{ marginTop: 12 }}>
            Built with care for bearded dragons, rabbits, and other exotic companions.
          </Txt>
        </Card>

        {/* Danger Zone */}
        <SectionHeader title="Danger Zone" />
        <AppButton
          title="Clear All Data & Start Fresh"
          icon="trash-2"
          variant="ghost"
          tone="error"
          onPress={handleClearData}
          busy={busy}
          fullWidth
        />
      </ScrollView>
    </View>
  );
}
