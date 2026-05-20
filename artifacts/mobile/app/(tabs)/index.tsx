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

const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core"];

function StatCard({ label, value, icon, colors, accent = false }: {
  label: string; value: string | number; icon: string;
  colors: ReturnType<typeof useColors>; accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: accent ? colors.primary + "15" : colors.card, borderColor: accent ? colors.primary + "40" : colors.border }]}>
      <View style={[styles.statIconBg, { backgroundColor: accent ? colors.primary + "25" : colors.muted }]}>
        <Feather name={icon as never} size={15} color={accent ? colors.primary : colors.mutedForeground} />
      </View>
      <Text style={[styles.statValue, { color: accent ? colors.primary : colors.foreground, fontFamily: "Outfit_700Bold" }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
        {label}
      </Text>
    </View>
  );
}

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

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

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
        {/* Hero Header */}
        <LinearGradient
          colors={[colors.primary + "22", colors.primary + "06", "transparent"]}
          style={[styles.heroGradient, { paddingTop: topPadding + 20 }]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                {greeting} 👋
              </Text>
              <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                FitForge
              </Text>
              <Text style={[styles.heroDate, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                {todayDate}
              </Text>
            </View>
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={[styles.streakPill, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }]}
            >
              <Feather name="zap" size={14} color="#000" />
              <Text style={[styles.streakText, { fontFamily: "Outfit_700Bold" }]}>
                {summary?.currentStreak ?? 0}d
              </Text>
            </Pressable>
          </View>

          {/* Weekly Goal Progress */}
          <View style={[styles.weekGoalCard, { backgroundColor: colors.card + "CC", borderColor: colors.border }]}>
            <View style={styles.weekGoalHeader}>
              <Text style={[styles.weekGoalLabel, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                Weekly Goal
              </Text>
              <Text style={[styles.weekGoalCount, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>
                {weekDone} / {weekTarget}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={[colors.primary, colors.primary + "99"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${weekProgress * 100}%` as never }]}
              />
            </View>
            <Text style={[styles.weekGoalSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
              {weekTarget - weekDone > 0 ? `${weekTarget - weekDone} more to hit your weekly target` : "Weekly goal achieved! 🎉"}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats Grid */}
          {summaryLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.statsGrid}>
              <StatCard label="Workouts" value={summary?.totalWorkouts ?? 0} icon="activity" colors={colors} accent />
              <StatCard label="This Week" value={weekDone} icon="calendar" colors={colors} />
              <StatCard label="Hours" value={Math.round((summary?.totalMinutes ?? 0) / 60)} icon="clock" colors={colors} />
              <StatCard label="Streak" value={`${summary?.currentStreak ?? 0}d`} icon="zap" colors={colors} accent />
            </View>
          )}

          {/* Muscle Explorer */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
              Train by Muscle
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {MUSCLE_GROUPS.map((mg) => (
                <Pressable
                  key={mg}
                  style={({ pressed }) => [styles.muscleChip, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/muscle/${mg}` as never);
                  }}
                >
                  <Text style={[styles.muscleEmoji]}>
                    {mg === "chest" ? "💪" : mg === "back" ? "🦾" : mg === "legs" ? "🦵" : mg === "shoulders" ? "🏋️" : mg === "arms" ? "💪" : "🔥"}
                  </Text>
                  <Text style={[styles.muscleChipText, { color: colors.foreground, fontFamily: "Outfit_500Medium" }]}>
                    {mg.charAt(0).toUpperCase() + mg.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Quick Start Workouts */}
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
                    colors={[colors.primary + "18", "transparent"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.workoutCardGrad}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.workoutName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                      {w.name}
                    </Text>
                    <Text style={[styles.workoutMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {w.estimatedMinutes} min · {w.difficulty} · {w.exerciseCount ?? "?"} exercises
                    </Text>
                  </View>
                  <View style={[styles.startBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }]}>
                    <Feather name="play" size={14} color="#000" />
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
                  <Feather name="activity" size={28} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                  No workouts yet
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  Log your first workout to start tracking progress
                </Text>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/(tabs)/workouts" as never)}
                >
                  <Text style={[styles.emptyBtnText, { fontFamily: "Outfit_600SemiBold" }]}>Browse Workouts</Text>
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
  heroGradient: { paddingHorizontal: 20, paddingBottom: 24 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 14, marginBottom: 2 },
  heroTitle: { fontSize: 34, lineHeight: 40 },
  heroDate: { fontSize: 13, marginTop: 4 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24 },
  streakText: { fontSize: 14, color: "#000" },
  weekGoalCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  weekGoalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  weekGoalLabel: { fontSize: 15 },
  weekGoalCount: { fontSize: 15 },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  weekGoalSub: { fontSize: 12, marginTop: 8 },
  content: { paddingHorizontal: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20, marginBottom: 28 },
  statCard: { flex: 1, minWidth: "45%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  statIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 26, lineHeight: 30 },
  statLabel: { fontSize: 12 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17 },
  seeAll: { fontSize: 13 },
  muscleChip: { alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 14, minWidth: 80, gap: 6 },
  muscleEmoji: { fontSize: 22 },
  muscleChipText: { fontSize: 12 },
  workoutCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, overflow: "hidden", padding: 16, marginBottom: 10 },
  workoutCardGrad: { ...StyleSheet.absoluteFillObject },
  workoutName: { fontSize: 15 },
  workoutMeta: { fontSize: 12, marginTop: 3 },
  startBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  logCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  logDot: { width: 10, height: 10, borderRadius: 5 },
  logName: { fontSize: 14 },
  logMeta: { fontSize: 12, marginTop: 2 },
  stars: { fontSize: 13 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 240 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 4 },
  emptyBtnText: { fontSize: 14, color: "#000" },
});
