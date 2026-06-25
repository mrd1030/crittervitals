import React from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { Display, Txt, Badge } from "@/src/components/ui";
import { Pet } from "@/src/models/types";
import { SPECIES_TEMPLATES } from "@/src/constants/species";

interface PetHeroProps {
  pet: Pet;
  onBack: () => void;
  onChangePhoto: () => void;
  onEdit: () => void;
}

export function PetHero({ pet, onBack, onChangePhoto, onEdit }: PetHeroProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const template = SPECIES_TEMPLATES[pet.species];
  const heroH = 340;

  return (
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
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={onChangePhoto}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="camera" size={20} color="#fff" />
          </Pressable>
          <Pressable
            onPress={onEdit}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="edit-2" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={{ position: "absolute", left: t.spacing.lg, right: t.spacing.lg, bottom: t.spacing.lg }}>
        <Display size={34} color="#FFFFFF">{pet.name}</Display>
        <Txt size={14} color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>
          {template.emoji} {template.label}{pet.morph ? ` · ${pet.morph}` : ""}
        </Txt>
      </View>
    </View>
  );
}
