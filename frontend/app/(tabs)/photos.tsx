import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { usePetData } from "@/src/hooks/usePetData";
import { Txt, Card, AppButton, Chip, EmptyState } from "@/src/components/ui";
import { Header } from "@/src/components/Header";
import { AppTextInput } from "@/src/components/forms";
import { useToast } from "@/src/components/Toast";
import { PhotoRepo } from "@/src/repositories";
import { PHOTO_CATEGORIES } from "@/src/constants/species";
import { PhotoCategory } from "@/src/models/types";
import { capturePhoto, pickPhoto } from "@/src/services/photos";
import { relativeTime } from "@/src/utils/format";

const FILTERS: { key: PhotoCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  ...PHOTO_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
];

export default function PhotosScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const { activePet, bump } = useData();
  const { photos, loading, reload } = usePetData();

  const [filter, setFilter] = useState<PhotoCategory | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [pendingCat, setPendingCat] = useState<PhotoCategory>("eyes");
  const [pendingNote, setPendingNote] = useState("");

  const filtered = useMemo(
    () => (filter === "all" ? photos : photos.filter((p) => p.category === filter)),
    [photos, filter],
  );

  const gap = t.spacing.md;
  const colW = (width - t.spacing.lg * 2 - gap) / 2;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // keep latest two
      return [...prev, id];
    });
  };

  const addPhoto = async (mode: "camera" | "library") => {
    const res = mode === "camera" ? await capturePhoto() : await pickPhoto();
    if (res.ok) {
      setPendingUri(res.uri);
      setPendingCat(filter === "all" ? "eyes" : filter);
      setPendingNote("");
    } else if (res.reason === "blocked") {
      toast.show("Enable photo access in Settings", "error");
    } else if (res.reason === "error") {
      toast.show("Could not open photos", "error");
    }
  };

  const savePending = async () => {
    if (!pendingUri || !activePet) return;
    await PhotoRepo.insert({
      petId: activePet.id,
      uri: pendingUri,
      category: pendingCat,
      note: pendingNote.trim() || undefined,
      takenAt: new Date().toISOString(),
    });
    setPendingUri(null);
    setPendingNote("");
    bump();
    reload();
    toast.show("Photo added to journal", "success");
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Photo Journal" subtitle={activePet ? `${photos.length} photos` : undefined} />

      {/* Category filter — single horizontal scroller, part of the sticky header */}
      <View style={{ height: 56, borderBottomWidth: 1, borderBottomColor: t.colors.divider }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing.lg, gap: 8, alignItems: "center" }}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} testID={`photofilter-${f.key}`} />
          ))}
        </ScrollView>
      </View>

      {!loading && filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState
            testID="photos-empty"
            icon="camera"
            title="No photos yet"
            subtitle="Add photos to track physical changes over time — especially eyes and overall body condition."
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 150 + insets.bottom }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
            {filtered.map((p) => {
              const selIndex = selected.indexOf(p.id);
              const isSel = selIndex >= 0;
              return (
                <Pressable key={p.id} testID={`photo-${p.id}`} onPress={() => toggleSelect(p.id)} style={{ width: colW }}>
                  <View style={{ borderRadius: t.radius.md, overflow: "hidden", borderWidth: isSel ? 3 : 1, borderColor: isSel ? t.colors.brandPrimary : t.colors.border }}>
                    <Image source={{ uri: p.uri }} style={{ width: "100%", height: colW * 1.1 }} contentFit="cover" transition={200} />
                    {isSel && (
                      <View style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: t.colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
                        <Txt size={13} weight="800" color={t.colors.onBrandPrimary}>{selIndex + 1}</Txt>
                      </View>
                    )}
                  </View>
                  <Txt size={12} weight="700" style={{ marginTop: 6, textTransform: "capitalize" }}>{p.category}</Txt>
                  <Txt size={11} color={t.colors.onSurfaceTertiary}>{relativeTime(p.takenAt)}</Txt>
                  {p.note ? <Txt size={11} color={t.colors.onSurfaceSecondary} numberOfLines={1}>{p.note}</Txt> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Selection / add bar */}
      {pendingUri ? (
        <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
          <View style={{ padding: t.spacing.lg, paddingBottom: insets.bottom + 12, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.divider }}>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <Image source={{ uri: pendingUri }} style={{ width: 64, height: 64, borderRadius: 10 }} contentFit="cover" />
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Txt size={13} weight="700" color={t.colors.onSurfaceSecondary} style={{ marginBottom: 8 }}>Categorize this photo</Txt>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {PHOTO_CATEGORIES.map((c) => (
                    <Chip key={c.key} label={c.label} selected={pendingCat === c.key} onPress={() => setPendingCat(c.key)} testID={`pendingcat-${c.key}`} />
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={{ marginBottom: 12 }}>
              <AppTextInput testID="pending-note" value={pendingNote} onChangeText={setPendingNote} placeholder="Add a note (optional)…" />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <AppButton title="Cancel" variant="outline" onPress={() => setPendingUri(null)} />
              <AppButton title="Save Photo" icon="check" onPress={savePending} testID="save-pending-photo" />
            </View>
          </View>
        </KeyboardStickyView>
      ) : selected.length === 2 ? (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: t.spacing.lg, paddingBottom: insets.bottom + 10, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.divider, flexDirection: "row", gap: 10 }}>
          <AppButton title="Clear" variant="outline" onPress={() => setSelected([])} fullWidth={false} style={{ paddingHorizontal: 24 }} />
          <View style={{ flex: 1 }}>
            <AppButton testID="compare-button" title="Compare Selected" icon="columns" onPress={() => router.push(`/photo-compare?a=${selected[0]}&b=${selected[1]}`)} />
          </View>
        </View>
      ) : (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: t.spacing.lg, paddingBottom: insets.bottom + 10, backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.divider, flexDirection: "row", gap: 10 }}>
          <AppButton title="Camera" icon="camera" variant="outline" onPress={() => addPhoto("camera")} testID="photo-camera" />
          <AppButton title="Add Photo" icon="image" onPress={() => addPhoto("library")} testID="photo-add" />
        </View>
      )}

      {selected.length === 1 && !pendingUri && (
        <View style={{ position: "absolute", bottom: insets.bottom + 88, alignSelf: "center", backgroundColor: t.colors.surfaceInverse, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
          <Txt size={12} weight="700" color={t.colors.onSurfaceInverse}>Select one more to compare</Txt>
        </View>
      )}
    </View>
  );
}
