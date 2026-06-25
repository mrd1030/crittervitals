import React, { useEffect, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { Txt, Card, Badge } from "@/src/components/ui";
import { Header } from "@/src/components/Header";
import { PhotoRepo } from "@/src/repositories";
import { Photo } from "@/src/models/types";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function PhotoCompare() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { activePet } = useData();
  const { a, b } = useLocalSearchParams<{ a?: string; b?: string }>();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [aId, setAId] = useState<string | undefined>(a);
  const [bId, setBId] = useState<string | undefined>(b);
  const [slot, setSlot] = useState<"a" | "b">("a");

  useEffect(() => {
    (async () => {
      if (activePet) setPhotos(await PhotoRepo.getByPet(activePet.id));
    })();
  }, [activePet]);

  const photoA = photos.find((p) => p.id === aId);
  const photoB = photos.find((p) => p.id === bId);

  const assign = (id: string) => {
    if (slot === "a") setAId(id);
    else setBId(id);
  };

  // Days between the two captures — surfaces "how much time passed" at a glance,
  // which is the whole point of comparison for monitoring progression.
  const daysApart =
    photoA && photoB
      ? Math.abs(Math.round((new Date(photoB.takenAt).getTime() - new Date(photoA.takenAt).getTime()) / 86400000))
      : null;

  const Half = ({ photo, label }: { photo?: Photo; label: string }) => (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Badge label={label} tone="brand" />
        {photo && <Txt size={11} color={t.colors.onSurfaceTertiary}>{fmt(photo.takenAt)}</Txt>}
      </View>
      <View style={{ aspectRatio: 0.8, borderRadius: t.radius.md, overflow: "hidden", backgroundColor: t.colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <Txt size={12} color={t.colors.onSurfaceTertiary}>Pick a photo</Txt>
        )}
      </View>
      {photo?.note ? <Txt size={12} color={t.colors.onSurfaceSecondary} style={{ marginTop: 6 }} numberOfLines={2}>{photo.note}</Txt> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Compare Photos" showBack />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: insets.bottom + 24 }}>
        {/* Synchronized vertical split with central divider */}
        <View style={{ flexDirection: "row", gap: 0 }}>
          <Half photo={photoA} label="Before" />
          <View style={{ width: 1, backgroundColor: t.colors.borderStrong, marginHorizontal: t.spacing.md }} />
          <Half photo={photoB} label="After" />
        </View>

        {daysApart != null && (
          <Card style={{ marginTop: t.spacing.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Txt size={13} color={t.colors.onSurfaceSecondary}>These photos are</Txt>
            <Txt size={15} weight="800" color={t.colors.brandPrimary}>{daysApart} days</Txt>
            <Txt size={13} color={t.colors.onSurfaceSecondary}>apart</Txt>
          </Card>
        )}

        {/* Slot selector */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>
          {(["a", "b"] as const).map((s) => (
            <Pressable
              key={s}
              testID={`slot-${s}`}
              onPress={() => setSlot(s)}
              style={{ flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: slot === s ? t.colors.brandPrimary : t.colors.surfaceSecondary, borderWidth: 1, borderColor: slot === s ? t.colors.brandPrimary : t.colors.border }}
            >
              <Txt size={14} weight="700" color={slot === s ? t.colors.onBrandPrimary : t.colors.onSurfaceSecondary}>
                Replace {s === "a" ? "Before" : "After"}
              </Txt>
            </Pressable>
          ))}
        </View>

        {/* Photo picker strip */}
        <Txt size={13} weight="700" color={t.colors.onSurfaceSecondary} style={{ marginBottom: 10 }}>Tap a photo to place it</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm }}>
          {photos.map((p) => {
            const inUse = p.id === aId || p.id === bId;
            return (
              <Pressable key={p.id} testID={`pick-${p.id}`} onPress={() => assign(p.id)} style={{ width: 76 }}>
                <Image source={{ uri: p.uri }} style={{ width: 76, height: 76, borderRadius: 10, borderWidth: inUse ? 2 : 1, borderColor: inUse ? t.colors.brandPrimary : t.colors.border }} contentFit="cover" />
                <Txt size={10} color={t.colors.onSurfaceTertiary} style={{ marginTop: 3, textTransform: "capitalize" }} numberOfLines={1}>{p.category}</Txt>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
