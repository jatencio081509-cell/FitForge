import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const KEY = "fitforge_notification_settings";
export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  hour: 8,
  minute: 0,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (Platform.OS === "web") return DEFAULT_SETTINGS;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(KEY, JSON.stringify(settings));
}
