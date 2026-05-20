import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

function StatCard({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string | number;
  icon: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as never} size={18} color={colors.primary} />
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
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

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: topPadding + 16,
          paddingBottom: bottomPadding + 16,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
              {todayDate}
            </Text>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
              FitForge
            </Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.streakText, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>
              {summary?.currentStreak ?? 0} day streak
            </Text>
          </View>
        </View>

        {/* Stats */}
        {summaryLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Workouts" value={summary?.totalWorkouts ?? 0} icon="activity" colors={colors} />
            <StatCard label="This Week" value={summary?.workoutsThisWeek ?? 0} icon="calendar" colors={colors} />
            <StatCard label="Hours" value={Math.round((summary?.totalMinutes ?? 0) / 60)} icon="clock" colors={colors} />
            <StatCard label="Volume (kg)" value={Math.round(summary?.totalVolume ?? 0)} icon="trending-up" colors={colors} />
          </View>
        )}

        {/* Quick Start */}
        {workouts && workouts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
              Quick Start
            </Text>
            {workouts.slice(0, 3).map((w) => (
              <Pressable
                key={w.id}
                style={({ pressed }) => [
                  styles.workoutCard,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
                ]}
                onPress={() => router.push(`/workout/${w.id}` as never)}
              >
                <View>
                  <Text style={[styles.workoutName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    {w.name}
                  </Text>
                  <Text style={[styles.workoutMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    {w.estimatedMinutes} min · {w.difficulty}
                  </Text>
                </View>
                <View style={[styles.startBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="play" size={14} color={colors.primaryForeground} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Recent Activity */}
        {recentLogs && recentLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
              Recent Activity
            </Text>
            {recentLogs.map((log) => (
              <View
                key={log.id}
                style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.logIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="check-circle" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    {log.workoutName}
                  </Text>
                  <Text style={[styles.logMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    {new Date(log.completedAt).toLocaleDateString()} · {log.durationMinutes} min
                  </Text>
                </View>
                {log.rating != null && (
                  <Text style={{ color: colors.primary, fontFamily: "Outfit_600SemiBold" }}>
                    {"★".repeat(log.rating)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {recentLogs?.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="activity" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
              No workouts yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
              Log your first workout to start tracking progress
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 13 },
  title: { fontSize: 30, marginTop: 2 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  streakText: { fontSize: 13 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  statCard: { flex: 1, minWidth: "45%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 6, alignItems: "flex-start" },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 12 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  workoutCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10 },
  workoutName: { fontSize: 15 },
  workoutMeta: { fontSize: 13, marginTop: 2 },
  startBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  logCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  logIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  logName: { fontSize: 14 },
  logMeta: { fontSize: 12, marginTop: 2 },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 32, alignItems: "center", gap: 10, marginTop: 12 },
  emptyTitle: { fontSize: 16 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
