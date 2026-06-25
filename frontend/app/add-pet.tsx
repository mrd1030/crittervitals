import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/useTheme";
import { useData } from "@/src/store/DataContext";
import { Header } from "@/src/components/Header";
import { PetForm, PetFormValue } from "@/src/components/PetForm";
import { useToast } from "@/src/components/Toast";
import { PetRepo } from "@/src/repositories";

export default function AddPet() {
  const t = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { refresh, setActivePet } = useData();
  const [busy, setBusy] = useState(false);

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
    toast.show(`${pet.name} added`, "success");
    setBusy(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <Header title="Add a Pet" showBack />
      <PetForm submitLabel="Create Pet" onSubmit={handleCreate} busy={busy} />
    </View>
  );
}
