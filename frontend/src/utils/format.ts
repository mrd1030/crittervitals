import { LogType } from "@/src/models/types";

export function formatWeight(grams: number | null | undefined, unit: "g" | "kg"): string {
  if (grams == null) return "—";
  if (unit === "kg") return `${(grams / 1000).toFixed(2)} kg`;
  return `${Math.round(grams)} g`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function timeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr12 = h % 12 === 0 ? 12 : h % 12;
  return `${hr12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export const LOG_META: Record<LogType, { icon: string; label: string; color: string }> = {
  weight: { icon: "trending-up", label: "Weight", color: "#2E5A3C" },
  symptom: { icon: "activity", label: "Symptom", color: "#D87B5B" },
  medication: { icon: "clock", label: "Medication", color: "#4A6B7C" },
  husbandry: { icon: "thermometer", label: "Husbandry", color: "#D4A373" },
  note: { icon: "edit-3", label: "Note", color: "#5A5F54" },
};
