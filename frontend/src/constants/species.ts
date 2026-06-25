import { SpeciesTemplate, Species, PhotoCategory } from "@/src/models/types";

// Species templates ship sensible defaults so onboarding feels instant and the
// app is genuinely useful from the first tap. Bearded Dragon & Rabbit are
// prioritized per the product brief.
export const SPECIES_TEMPLATES: Record<Species, SpeciesTemplate> = {
  bearded_dragon: {
    species: "bearded_dragon",
    label: "Bearded Dragon",
    emoji: "🦎",
    defaultWeightGoalGrams: 450,
    weightUnitHint: "Healthy adults: 350–600 g",
    commonConditions: [
      "Heart support",
      "Eye inflammation",
      "GI motility",
      "Metabolic bone disease",
      "Head weakness",
      "Heat stress",
    ],
    symptomPresets: [
      "Low energy",
      "Not eating",
      "Eye swelling",
      "Eye discharge",
      "Straining / no stool",
      "Head tilt",
      "Labored breathing",
      "Bloating",
      "Lethargic basking",
    ],
    husbandry: {
      tempRangeF: [95, 110],
      humidityRange: [30, 40],
      notes: "Basking 95–110°F, cool side 75–85°F, UVB daily.",
    },
    careTips: [
      "Weigh at the same time each day for consistent trends.",
      "Photograph both eyes weekly to catch inflammation early.",
      "Log basking temp when energy seems low — heat drives appetite.",
    ],
  },
  rabbit: {
    species: "rabbit",
    label: "Rabbit",
    emoji: "🐰",
    defaultWeightGoalGrams: 1800,
    weightUnitHint: "Varies by breed: 1.5–2.5 kg",
    commonConditions: [
      "GI stasis",
      "Dental disease",
      "Head tilt",
      "Sore hocks",
      "Eye discharge",
      "Heart support",
    ],
    symptomPresets: [
      "Not eating",
      "No droppings",
      "Small droppings",
      "Hunched posture",
      "Teeth grinding",
      "Head tilt",
      "Runny eyes",
      "Lethargic",
      "Soft stool",
    ],
    husbandry: {
      tempRangeF: [60, 72],
      humidityRange: [40, 60],
      notes: "Keep cool (60–72°F). Unlimited hay. Watch droppings closely.",
    },
    careTips: [
      "Track droppings daily — a drop in output is the first GI stasis sign.",
      "Weigh weekly; sudden loss signals dental or gut trouble.",
      "Note hay & water intake alongside symptoms.",
    ],
  },
  other: {
    species: "other",
    label: "Other Pet",
    emoji: "🐾",
    defaultWeightGoalGrams: 500,
    weightUnitHint: "Set a goal that fits your pet",
    commonConditions: ["Heart support", "GI issues", "Eye monitoring"],
    symptomPresets: [
      "Low energy",
      "Not eating",
      "Eye issue",
      "Digestive issue",
      "Breathing issue",
      "Lethargic",
    ],
    husbandry: {
      tempRangeF: [68, 78],
      humidityRange: [40, 60],
      notes: "Track the environmental factors relevant to your pet.",
    },
    careTips: [
      "Log consistently at the same time of day.",
      "Photos help your vet see changes you might miss.",
    ],
  },
};

export const PHOTO_CATEGORIES: { key: PhotoCategory; label: string; icon: string }[] = [
  { key: "eyes", label: "Eyes", icon: "eye" },
  { key: "overall", label: "Overall", icon: "image" },
  { key: "enclosure", label: "Enclosure", icon: "home" },
  { key: "stool", label: "Stool", icon: "droplet" },
  { key: "other", label: "Other", icon: "more-horizontal" },
];

export const DISCLAIMER =
  "CritterVitals is a tracking tool to help you observe and share your pet's health over time. It is not a medical device and does not provide veterinary or medical advice. Always consult a qualified exotic-pet veterinarian for diagnosis and treatment.";
