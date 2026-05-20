import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  useGetPersonalRecords,
  useGetProgressSummary,
  useGetWeeklyProgress,
} from "@workspace/api-client-react";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 140;

function WeeklyChart({
  data,
  colors,
}: {
  data: { week: string; workoutCount: number; totalMinutes: number; totalVolume: number }[];
  colors: ReturnType<typeof useColors>;
}) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map((d) => d.workoutCount), 1);
  const barWidth = Math.floor((CHART_WIDTH - 16) / data.length) - 4;

  return (
    <View style={[styles.chartBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
        Weekly Workouts
      </Text>
      <View style={styles.chartArea}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.workoutCount / maxCount) * CHART_HEIGHT);
          const date = new Date(d.week);
          const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <View key={i} style={[styles.barGroup, { width: barWidth + 4 }]}>
              <View style={[styles.bar, { height: barH, backgroundColor: colors.primary, borderRadius: 5, width: barWidth }]} />
              <Text style={[styles.barLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]} numberOfLines={1}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const { data: summary, isLoading: summaryLoading } = useGetProgressSummary();
  const { data: weekly, isLoading: weeklyLoading } = useGetWeeklyProgress();
  const { data: prs, isLoading: prsLoading } = useGetPersonalRecords();

  const isLoading = summaryLoading || weeklyLoading || prsLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding + 16,
          paddingBottom: bottomPadding + 16,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
          Progress
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Summary Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Total Workouts", value: summary?.totalWorkouts ?? 0, icon: "activity" },
                { label: "Current Streak", value: `${summary?.currentStreak ?? 0}d`, icon: "zap" },
                { label: "Longest Streak", value: `${summary?.longestStreak ?? 0}d`, icon: "award" },
                { label: "Total Hours", value: Math.round((summary?.totalMinutes ?? 0) / 60), icon: "clock" },
              ].map((s) => (
                <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name={s.icon as never} size={16} color={colors.primary} />
                  <Text style={[styles.statVal, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                    {s.value}
                  </Text>
                  <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Weekly Chart */}
            {weekly && weekly.length > 0 && (
              <WeeklyChart data={weekly} colors={colors} />
            )}

            {/* Volume stat */}
            {(summary?.totalVolume ?? 0) > 0 && (
              <View style={[styles.volumeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.volumeLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    Total Volume Lifted
                  </Text>
                  <Text style={[styles.volumeValue, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>
                    {(summary!.totalVolume / 1000).toFixed(1)}t
                  </Text>
                </View>
                <Feather name="trending-up" size={36} color={colors.primary + "50"} />
              </View>
            )}

            {/* Personal Records */}
            {prs && prs.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                  Personal Records
                </Text>
                {prs.map((pr) => (
                  <View key={pr.exerciseId} style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.prIcon, { backgroundColor: colors.primary + "20" }]}>
                      <Feather name="award" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                        {pr.exerciseName}
                      </Text>
                      <Text style={[styles.prMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                        {pr.muscleGroup} · {new Date(pr.achievedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      {pr.maxWeight != null && (
                        <Text style={[styles.prWeight, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>
                          {pr.maxWeight}kg
                        </Text>
                      )}
                      <Text style={[styles.prReps, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                        {pr.maxReps} reps
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {(!prs || prs.length === 0) && (
              <View style={[styles.emptyCard, { borderColor: colors.border }]}>
                <Feather name="award" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  Log workouts with sets & weights to see personal records
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, marginBottom: 20 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statBox: { flex: 1, minWidth: "45%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, alignItems: "flex-start" },
  statVal: { fontSize: 22 },
  statLbl: { fontSize: 11 },
  chartBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 15, marginBottom: 16 },
  chartArea: { flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT + 24, gap: 2 },
  barGroup: { alignItems: "center", justifyContent: "flex-end", height: CHART_HEIGHT + 20 },
  bar: { marginBottom: 6 },
  barLabel: { fontSize: 8, textAlign: "center" },
  volumeBox: { borderRadius: 16, borderWidth: 1, padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  volumeLabel: { fontSize: 13 },
  volumeValue: { fontSize: 36, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  prCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  prIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  prName: { fontSize: 14 },
  prMeta: { fontSize: 12, marginTop: 2 },
  prWeight: { fontSize: 18 },
  prReps: { fontSize: 12 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12, marginTop: 8 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
