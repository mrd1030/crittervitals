// ReminderService — smart local medication notifications with snooze.
// Notifications only fire in a real dev/production build (not Expo Go SDK 53+
// or web), so every call is guarded and fails soft. We persist scheduled IDs
// per medication so reminders can be cancelled/rescheduled cleanly.

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { storage } from "@/src/utils/storage";
import { Medication, Pet } from "@/src/models/types";

const SCHEDULE_KEY = (medId: string) => `cv_reminder_${medId}`;

// Foreground presentation so reminders are visible while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (!settings.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function getPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined" | "unavailable"
> {
  if (Platform.OS === "web") return "unavailable";
  try {
    const s = await Notifications.getPermissionsAsync();
    if (s.granted) return "granted";
    if (s.canAskAgain) return "undetermined";
    return "denied";
  } catch {
    return "unavailable";
  }
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(":").map((n) => parseInt(n, 10));
  return { hour: h || 0, minute: m || 0 };
}

export async function scheduleMedicationReminders(
  med: Medication,
  pet: Pet,
): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelMedicationReminders(med.id);
  if (!med.active) return;
  const ok = await requestNotificationPermission();
  if (!ok) return;

  const ids: string[] = [];
  for (const time of med.times) {
    const { hour, minute } = parseTime(time);
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${pet.name}: ${med.name}`,
          body: `Time for ${med.dosage} ${med.unit} (${med.route}).`,
          data: { medId: med.id, petId: pet.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      ids.push(id);
    } catch {
      // ignore individual scheduling failures
    }
  }
  await storage.setItem(SCHEDULE_KEY(med.id), JSON.stringify(ids));
}

export async function cancelMedicationReminders(medId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const raw = await storage.getItem<string>(SCHEDULE_KEY(medId), "[]");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
    await storage.removeItem(SCHEDULE_KEY(medId));
  } catch {
    // ignore
  }
}

// Smart snooze — re-notify after N minutes from now (one-shot).
export async function snoozeReminder(
  med: Medication,
  pet: Pet,
  minutes: number,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Snoozed: ${med.name} for ${pet.name}`,
        body: `Reminder: ${med.dosage} ${med.unit}.`,
        data: { medId: med.id, petId: pet.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
      },
    });
  } catch {
    // ignore
  }
}

export async function rescheduleAllForPet(
  meds: Medication[],
  pet: Pet,
): Promise<void> {
  for (const m of meds) {
    await scheduleMedicationReminders(m, pet);
  }
}
