import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";

import { useColors } from "@/hooks/useColors";
import { useListWorkoutLogs, useListWorkouts } from "@workspace/api-client-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const { data: recentLogs } = useListWorkoutLogs({ limit: 3 });
  const { data: workouts } = useListWorkouts();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Athlete";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={[colors.primary + "22", "transparent"]}
          style={[styles.hero, { paddingTop: topPadding + 20 }]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                {greeting} 👋
              </Text>
              <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                {firstName}
              </Text>
            </View>
            <Pressable
              onPress={() => signOut()}
              style={[styles.signOutBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="log-out" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.startBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(tabs)/workouts" as never);
            }}
          >
            <Feather name="play" size={18} color="#000" />
            <Text style={[styles.startBtnText, { fontFamily: "Outfit_700Bold" }]}>Start a Workout</Text>
          </Pressable>
        </LinearGradient>

        {/* ── Quick Start Workouts ── */}
        {workouts && workouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                Your Workouts
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/workouts" as never)}>
                <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>See all</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {workouts.slice(0, 6).map((w) => (
                <Pressable
                  key={w.id}
                  style={({ pressed }) => [styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/workout/${w.id}` as never);
                  }}
                >
                  <LinearGradient colors={[colors.primary + "18", "transparent"]} style={StyleSheet.absoluteFillObject} />
                  <View style={[styles.diffDot, { backgroundColor: DIFFICULTY_COLORS[w.difficulty] ?? colors.primary }]} />
                  <Text style={[styles.workoutCardName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]} numberOfLines={2}>
                    {w.name}
                  </Text>
                  <Text style={[styles.workoutCardMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    {w.estimatedMinutes}m · {w.exerciseCount ?? "?"} ex
                  </Text>
                  <View style={[styles.cardPlayBtn, { backgroundColor: colors.primary }]}>
                    <Feather name="play" size={11} color="#000" />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
            Recent Activity
          </Text>

          {recentLogs && recentLogs.length > 0 ? (
            <View style={styles.logList}>
              {recentLogs.map((log) => (
                <View key={log.id} style={[styles.logRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.logName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                      {log.workoutName}
                    </Text>
                    <Text style={[styles.logMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {new Date(log.completedAt).toLocaleDateString()} · {log.durationMinutes} min
                    </Text>
                  </View>
                  {log.rating != null && (
                    <Text style={{ color: colors.primary, fontSize: 12 }}>{"★".repeat(log.rating)}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="activity" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                  No sessions yet
                </Text>
                <Text style={[styles.emptyBody, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  Complete a workout to see it here
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 13 },
  heroTitle: { fontSize: 26, lineHeight: 32 },
  signOutBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, alignSelf: "stretch", justifyContent: "center" },
  startBtnText: { fontSize: 16, color: "#000" },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  seeAll: { fontSize: 13 },
  horizontalList: { paddingRight: 20, gap: 10 },
  workoutCard: { width: 148, borderRadius: 16, borderWidth: 1, padding: 14, overflow: "hidden", gap: 6 },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  workoutCardName: { fontSize: 14, lineHeight: 19 },
  workoutCardMeta: { fontSize: 11 },
  cardPlayBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  logList: { gap: 8 },
  logRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logName: { fontSize: 14 },
  logMeta: { fontSize: 12, marginTop: 1 },
  emptyRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 14 },
  emptyBody: { fontSize: 12, marginTop: 2 },
});
