// PhotoService — capture or pick photos with proper, contextual permission
// handling. Returns a local URI we persist in the photo journal.

import { Platform, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

export type PhotoResult =
  | { ok: true; uri: string }
  | { ok: false; reason: "cancelled" | "denied" | "blocked" | "error" };

export async function ensureCameraPermission(): Promise<
  "granted" | "denied" | "blocked"
> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return "granted";
  if (!current.canAskAgain) return "blocked";
  const req = await ImagePicker.requestCameraPermissionsAsync();
  if (req.granted) return "granted";
  return req.canAskAgain ? "denied" : "blocked";
}

export async function ensureLibraryPermission(): Promise<
  "granted" | "denied" | "blocked"
> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return "granted";
  if (!current.canAskAgain) return "blocked";
  const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (req.granted) return "granted";
  return req.canAskAgain ? "denied" : "blocked";
}

export async function capturePhoto(): Promise<PhotoResult> {
  try {
    if (Platform.OS !== "web") {
      const status = await ensureCameraPermission();
      if (status !== "granted") return { ok: false, reason: status === "blocked" ? "blocked" : "denied" };
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled) return { ok: false, reason: "cancelled" };
    return { ok: true, uri: result.assets[0].uri };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function pickPhoto(): Promise<PhotoResult> {
  try {
    if (Platform.OS !== "web") {
      const status = await ensureLibraryPermission();
      if (status !== "granted") return { ok: false, reason: status === "blocked" ? "blocked" : "denied" };
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled) return { ok: false, reason: "cancelled" };
    return { ok: true, uri: result.assets[0].uri };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function openAppSettings(): void {
  Linking.openSettings().catch(() => {});
}
