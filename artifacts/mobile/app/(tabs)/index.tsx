import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  useGetProgressSummary,
  useListWorkoutLogs,
  useListWorkouts,
} from "@workspace/api-client-react";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: summary, isLoading: summaryLoading } = useGetProgressSummary();
  const { data: recentLogs } = useListWorkoutLogs({ limit: 3 });
  const { data: workouts } = useListWorkouts();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const weekTarget = 4;
  const weekDone = summary?.workoutsThisWeek ?? 0;
  const weekProgress = Math.min(weekDone / weekTarget, 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPadding + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary + "28", colors.primary + "08", "transparent"]}
          style={[styles.hero, { paddingTop: topPadding + 24 }]}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                {greeting}
              </Text>
              <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                FitForge
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/workouts" as never);
              }}
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="play" size={16} color="#000" />
              <Text style={[styles.startBtnText, { fontFamily: "Outfit_700Bold" }]}>Start</Text>
            </Pressable>
          </View>

          {/* Stats strip */}
          {summaryLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.statsStrip}>
              {[
                { label: "Streak", value: `${summary?.currentStreak ?? 0}d`, icon: "zap", accent: true },
                { label: "This Week", value: String(weekDone), icon: "calendar" },
                { label: "Hours", value: String(Math.round((summary?.totalMinutes ?? 0) / 60)), icon: "clock" },
                { label: "Workouts", value: String(summary?.totalWorkouts ?? 0), icon: "activity" },
              ].map((s) => (
                <View key={s.label} style={[styles.statItem, { backgroundColor: s.accent ? colors.primary + "18" : colors.card, borderColor: s.accent ? colors.primary + "40" : colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.accent ? colors.primary + "30" : colors.muted }]}>
                    <Feather name={s.icon as never} size={13} color={s.accent ? colors.primary : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.statVal, { color: s.accent ? colors.primary : colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                    {s.value}
                  </Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Weekly progress bar */}
          <View style={[styles.weekBar, { backgroundColor: colors.card + "CC", borderColor: colors.border }]}>
            <View style={styles.weekBarHeader}>
              <Text style={[styles.weekBarLabel, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                Weekly Goal
              </Text>
              <Text style={[styles.weekBarCount, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>
                {weekDone}/{weekTarget}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={[colors.primary, colors.primary + "88"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${weekProgress * 100}%` as never }]}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick Start */}
          {workouts && workouts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                  Quick Start
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/workouts" as never)}>
                  <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>See all</Text>
                </Pressable>
              </View>
              {workouts.slice(0, 3).map((w) => (
                <Pressable
                  key={w.id}
                  style={({ pressed }) => [styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/workout/${w.id}` as never);
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary + "15", "transparent"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.workoutName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                      {w.name}
                    </Text>
                    <Text style={[styles.workoutMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {w.estimatedMinutes} min · {w.difficulty} · {w.exerciseCount ?? "?"} exercises
                    </Text>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                    <Feather name="play" size={13} color="#000" />
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
              Recent Activity
            </Text>
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                    <Text style={[styles.stars, { color: colors.primary }]}>{"★".repeat(log.rating)}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <LinearGradient colors={[colors.primary + "20", colors.primary + "05"]} style={styles.emptyIconBg}>
                  <Feather name="activity" size={24} color={colors.primary} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    No workouts yet
                  </Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    Log your first session to start tracking
                  </Text>
                </View>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/(tabs)/workouts" as never)}
                >
                  <Feather name="arrow-right" size={16} color="#000" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20 },
  heroRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 },
  greeting: { fontSize: 13, marginBottom: 2 },
  heroTitle: { fontSize: 36, lineHeight: 42 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginTop: 4 },
  startBtnText: { fontSize: 14, color: "#000" },
  statsStrip: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statItem: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 5 },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 18, lineHeight: 22 },
  statLbl: { fontSize: 10 },
  weekBar: { borderRadius: 16, borderWidth: 1, padding: 14 },
  weekBarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  weekBarLabel: { fontSize: 14 },
  weekBarCount: { fontSize: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16 },
  seeAll: { fontSize: 13 },
  workoutCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, overflow: "hidden", padding: 14, marginBottom: 8 },
  workoutName: { fontSize: 15, lineHeight: 20 },
  workoutMeta: { fontSize: 12, marginTop: 2 },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  logCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logName: { fontSize: 14 },
  logMeta: { fontSize: 12, marginTop: 1 },
  stars: { fontSize: 12 },
  emptyCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  emptyIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 14 },
  emptyText: { fontSize: 12, marginTop: 2 },
  emptyBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
