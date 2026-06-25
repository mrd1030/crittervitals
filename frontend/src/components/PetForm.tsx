import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Species } from "@/src/models/types";
import { SPECIES_TEMPLATES } from "@/src/constants/species";
import { useTheme } from "@/src/theme/useTheme";
import { Txt, Card, Chip, AppButton } from "@/src/components/ui";
import { FormField, AppTextInput } from "@/src/components/forms";

export interface PetFormValue {
  name: string;
  species: Species;
  morph: string;
  weightGoalGrams: number | null;
  chronicConditions: string[];
  notes: string;
}

const SPECIES_ORDER: Species[] = ["bearded_dragon", "rabbit", "other"];

export function PetForm({
  initial,
  submitLabel,
  onSubmit,
  busy,
}: {
  initial?: Partial<PetFormValue>;
  submitLabel: string;
  onSubmit: (v: PetFormValue) => void;
  busy?: boolean;
}) {
  const t = useTheme();
  const [species, setSpecies] = useState<Species>(initial?.species ?? "bearded_dragon");
  const [name, setName] = useState(initial?.name ?? "");
  const [morph, setMorph] = useState(initial?.morph ?? "");
  const [weightGoal, setWeightGoal] = useState(
    initial?.weightGoalGrams != null
      ? String(initial.weightGoalGrams)
      : String(SPECIES_TEMPLATES["bearded_dragon"].defaultWeightGoalGrams),
  );
  const [conditions, setConditions] = useState<string[]>(initial?.chronicConditions ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const template = SPECIES_TEMPLATES[species];

  const selectSpecies = (s: Species) => {
    setSpecies(s);
    // Apply species template defaults for a frictionless start.
    setWeightGoal(String(SPECIES_TEMPLATES[s].defaultWeightGoalGrams));
    setConditions([]);
  };

  const toggleCondition = (c: string) => {
    setConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const canSubmit = name.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <FormField label="Species">
          <View style={{ gap: 10 }}>
            {SPECIES_ORDER.map((s) => {
              const tpl = SPECIES_TEMPLATES[s];
              const selected = species === s;
              return (
                <Card
                  key={s}
                  testID={`species-option-${s}`}
                  onPress={() => selectSpecies(s)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingVertical: 14,
                    borderColor: selected ? t.colors.brandPrimary : t.colors.border,
                    borderWidth: selected ? 2 : 1,
                    backgroundColor: selected ? t.colors.brandTertiary : undefined,
                  }}
                >
                  <Txt size={26}>{tpl.emoji}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt size={16} weight="700">{tpl.label}</Txt>
                    <Txt size={12} color={t.colors.onSurfaceSecondary} style={{ marginTop: 2 }}>
                      {tpl.weightUnitHint}
                    </Txt>
                  </View>
                  {selected && <Txt size={18} color={t.colors.brandPrimary}>✓</Txt>}
                </Card>
              );
            })}
          </View>
        </FormField>

        <FormField label="Name">
          <AppTextInput testID="pet-name-input" value={name} onChangeText={setName} placeholder="e.g. Sunny" />
        </FormField>

        <FormField label="Morph / Breed (optional)">
          <AppTextInput testID="pet-morph-input" value={morph} onChangeText={setMorph} placeholder="e.g. Citrus Hypo" />
        </FormField>

        <FormField label="Weight goal" hint={template.weightUnitHint}>
          <AppTextInput
            testID="pet-weight-goal-input"
            value={weightGoal}
            onChangeText={setWeightGoal}
            keyboardType="numeric"
            placeholder="450"
            suffix="g"
          />
        </FormField>

        <FormField label="Chronic conditions to monitor" hint="Tap any that apply — you can change these later.">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {template.commonConditions.map((c) => (
              <Chip
                key={c}
                label={c}
                selected={conditions.includes(c)}
                onPress={() => toggleCondition(c)}
                testID={`condition-${c}`}
              />
            ))}
          </View>
        </FormField>

        <FormField label="Notes (optional)">
          <AppTextInput value={notes} onChangeText={setNotes} placeholder="Anything your vet should know…" multiline />
        </FormField>
      </ScrollView>

      <View
        style={{
          padding: t.spacing.lg,
          paddingBottom: t.spacing.xl,
          borderTopWidth: 1,
          borderTopColor: t.colors.divider,
          backgroundColor: t.colors.surface,
        }}
      >
        <AppButton
          testID="pet-form-submit"
          title={submitLabel}
          icon="check"
          disabled={!canSubmit}
          loading={busy}
          onPress={() =>
            onSubmit({
              name: name.trim(),
              species,
              morph: morph.trim(),
              weightGoalGrams: weightGoal ? Number(weightGoal) : null,
              chronicConditions: conditions,
              notes: notes.trim(),
            })
          }
        />
      </View>
    </View>
  );
}
