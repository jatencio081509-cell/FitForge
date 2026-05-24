import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "@/hooks/useNotificationSettings";
import {
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleDailyWorkoutReminder,
  sendInstantNotification,
} from "@/hooks/useNotifications";

// ── Time options (5 AM – 10 PM, hourly) ──────────────────────────────────────
interface TimeOption {
  hour: number;
  minute: number;
  label: string;
}

function buildTimeOptions(): TimeOption[] {
  const opts: TimeOption[] = [];
  for (let h = 5; h <= 22; h++) {
    const suffix = h < 12 ? "AM" : "PM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    opts.push({ hour: h, minute: 0, label: `${display}:00 ${suffix}` });
  }
  return opts;
}

const TIME_OPTIONS = buildTimeOptions();

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    getNotificationSettings().then(setSettings);
  }, []);

  async function toggleEnabled(value: boolean) {
    if (!settings) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = { ...settings, enabled: value };
    setSettings(next);
    setSaving(true);
    await saveNotificationSettings(next);
    if (value) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyWorkoutReminder(next.hour, next.minute);
      }
    } else {
      await cancelAllNotifications();
    }
    setSaving(false);
  }

  async function selectTime(opt: TimeOption) {
    if (!settings) return;
    Haptics.selectionAsync();
    const next = { ...settings, hour: opt.hour, minute: opt.minute };
    setSettings(next);
    setSaving(true);
    await saveNotificationSettings(next);
    if (next.enabled) {
      const granted = await requestNotificationPermissions();
      if (granted) await scheduleDailyWorkoutReminder(next.hour, next.minute);
    }
    setSaving(false);
  }

  async function handleTest() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    await sendInstantNotification(
      "Time to Train 💪",
      "Your workout is waiting. Open FitForge and crush today's session!"
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!settings) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const selectedOpt = TIME_OPTIONS.find(
    (o) => o.hour === settings.hour && o.minute === settings.minute
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[colors.primary + "18", "transparent"]}
        style={[styles.header, { paddingTop: topPadding + 12 }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
          Settings
        </Text>
        {saving ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ width: 36 }} />
        ) : (
          <View style={{ width: 36 }} />
        )}
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      >
        {/* ── Workout Reminders card ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Section label */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="bell" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
              Workout Reminders
            </Text>
          </View>

          <Text style={[styles.cardBody, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
            Get a daily nudge to stay consistent. The reminder fires every day at your chosen time.
          </Text>

          {/* Toggle row */}
          <View style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground, fontFamily: "Outfit_500Medium" }]}>
              Daily reminder
            </Text>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={settings.enabled ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        {/* ── Time picker ── */}
        {settings.enabled && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="clock" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                Reminder Time
              </Text>
              {selectedOpt && (
                <Text style={[styles.selectedBadge, { backgroundColor: colors.primary + "20", color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>
                  {selectedOpt.label}
                </Text>
              )}
            </View>

            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map((opt) => {
                const isSelected = opt.hour === settings.hour && opt.minute === settings.minute;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => selectTime(opt)}
                    style={({ pressed }) => [
                      styles.timeChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        {
                          color: isSelected ? "#000" : colors.mutedForeground,
                          fontFamily: isSelected ? "Outfit_600SemiBold" : "Outfit_400Regular",
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Test notification ── */}
        {settings.enabled && Platform.OS !== "web" && (
          <Pressable
            onPress={handleTest}
            style={({ pressed }) => [
              styles.testBtn,
              {
                backgroundColor: testSent ? colors.primary : "transparent",
                borderColor: testSent ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather
              name={testSent ? "check" : "send"}
              size={16}
              color={testSent ? "#000" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.testBtnText,
                {
                  color: testSent ? "#000" : colors.mutedForeground,
                  fontFamily: "Outfit_500Medium",
                },
              ]}
            >
              {testSent ? "Notification sent!" : "Send test notification"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 20, textAlign: "center" },
  content: { padding: 20, gap: 16 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, flex: 1 },
  selectedBadge: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardBody: { fontSize: 13, lineHeight: 19 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
  },
  rowLabel: { fontSize: 15 },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeChipText: { fontSize: 13 },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  testBtnText: { fontSize: 14 },
});
