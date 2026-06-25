import React, { useState } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { Display, Txt, AppButton, Card } from "@/src/components/ui";
import { PetForm, PetFormValue } from "@/src/components/PetForm";
import { Header } from "@/src/components/Header";
import { PetRepo } from "@/src/repositories";
import { DISCLAIMER } from "@/src/constants/species";

const DRAGON = "https://images.unsplash.com/photo-1601491472415-1b4b4a689212?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";
const RABBIT = "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setActivePet, completeOnboarding, refresh } = useData();
  const [step, setStep] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await completeOnboarding();
    await refresh();
    router.replace("/(tabs)");
  };

  const handleCreate = async (v: PetFormValue) => {
    setBusy(true);
    const pet = await PetRepo.insert({
      name: v.name,
      species: v.species,
      morph: v.morph || undefined,
      chronicConditions: v.chronicConditions,
      weightGoalGrams: v.weightGoalGrams,
      notes: v.notes || undefined,
    });
    await refresh();
    await setActivePet(pet.id);
    await finish();
  };

  if (step === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
        <Header title="Add your first pet" subtitle="Apply a species template to start fast" showBack />
        <PetForm submitLabel="Create Pet & Continue" onSubmit={handleCreate} busy={busy} />
      </View>
    );
  }

  const heroH = Math.min(width * 0.95, 420);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={{ height: heroH }}>
          <View style={{ flexDirection: "row", flex: 1, gap: 6, paddingHorizontal: 6, paddingTop: insets.top + 6 }}>
            <Image source={{ uri: DRAGON }} style={{ flex: 1, borderRadius: 24 }} contentFit="cover" transition={300} />
            <View style={{ flex: 1, gap: 6 }}>
              <Image source={{ uri: RABBIT }} style={{ flex: 1, borderRadius: 24 }} contentFit="cover" transition={300} />
              <View
                style={{
                  flex: 1,
                  borderRadius: 24,
                  backgroundColor: t.colors.brandPrimary,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                }}
              >
                <Feather name="heart" size={30} color={t.colors.onBrandPrimary} />
                <Txt size={12} weight="700" color={t.colors.onBrandPrimary} style={{ marginTop: 8, textAlign: "center" }}>
                  Calm, daily care
                </Txt>
              </View>
            </View>
          </View>
          <LinearGradient
            colors={["transparent", t.colors.surface]}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70 }}
            pointerEvents="none"
          />
        </View>

        <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: t.spacing.lg }}>
          <Txt size={13} weight="800" color={t.colors.brandSecondary} style={{ letterSpacing: 1.5, marginBottom: 6 }}>
            CRITTERVITALS
          </Txt>
          <Display size={36} style={{ lineHeight: 42 }}>
            Proactive care for exotic pets
          </Display>
          <Txt size={16} color={t.colors.onSurfaceSecondary} style={{ marginTop: 12, lineHeight: 24 }}>
            Track weight, symptoms, medications and photos. Spot changes early and walk into every vet visit prepared — built especially for bearded dragons and rabbits.
          </Txt>

          <Card style={{ marginTop: t.spacing.xl, backgroundColor: t.colors.brandTertiary, borderColor: t.colors.brandTertiary }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Feather name="shield" size={20} color={t.colors.brandPrimary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="800" color={t.colors.onBrandTertiary}>A tracking tool — not medical advice</Txt>
                <Txt size={13} color={t.colors.onBrandTertiary} style={{ marginTop: 6, lineHeight: 20 }}>
                  {DISCLAIMER}
                </Txt>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: t.spacing.lg,
          paddingTop: t.spacing.md,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: t.colors.divider,
          backgroundColor: t.colors.surface,
          gap: 10,
        }}
      >
        <AppButton testID="onboarding-add-pet" title="Add Your Pet" icon="plus" onPress={() => setStep(1)} />
        <AppButton testID="onboarding-explore-sample" title="Explore with sample data" variant="ghost" onPress={finish} />
      </View>
    </View>
  );
}
