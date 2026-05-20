import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  useGetPersonalRecords,
  useGetProfile,
  useGetProgressSummary,
  useGetWeeklyProgress,
  useListWeightLogs,
  useCreateWeightLog,
  useUpdateProfile,
  useAiWeightAdvice,
} from "@workspace/api-client-react";

const { width } = Dimensions.get("window");
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 130;

function WeeklyChart({ data, colors }: {
  data: { week: string; workoutCount: number; totalMinutes: number; totalVolume: number }[];
  colors: ReturnType<typeof useColors>;
}) {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map((d) => d.workoutCount), 1);
  const barWidth = Math.floor((CHART_WIDTH - 16) / data.length) - 5;

  return (
    <View style={[styles.chartBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
        Weekly Workouts
      </Text>
      <View style={styles.chartArea}>
        {data.map((d, i) => {
          const barH = Math.max(6, (d.workoutCount / maxCount) * CHART_HEIGHT);
          const label = new Date(d.week).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isRecent = i === data.length - 1;
          return (
            <View key={i} style={[styles.barGroup, { width: barWidth + 5 }]}>
              {isRecent ? (
                <LinearGradient colors={[colors.primary, colors.primary + "88"]} style={[styles.bar, { height: barH, width: barWidth }]} />
              ) : (
                <View style={[styles.bar, { height: barH, backgroundColor: colors.primary + "40", width: barWidth }]} />
              )}
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

function WeightChart({ data, unit, goalWeight, colors }: {
  data: { weight: number; loggedAt: string }[];
  unit: string; goalWeight?: number | null;
  colors: ReturnType<typeof useColors>;
}) {
  if (!data || data.length === 0) return null;
  const weights = data.map(d => d.weight);
  const min = Math.min(...weights) - 2;
  const max = Math.max(...weights, goalWeight ?? 0) + 2;
  const range = max - min;
  const W = CHART_WIDTH - 32;
  const H = 100;

  const pts = data.slice(-12).reverse().map((d, i, arr) => {
    const x = arr.length === 1 ? W / 2 : (i / (arr.length - 1)) * W;
    const y = H - ((d.weight - min) / range) * H;
    return { x, y, weight: d.weight, date: d.loggedAt };
  });

  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <View style={[styles.chartBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.chartTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
        Weight History
      </Text>
      <View style={{ height: H + 30, position: "relative" }}>
        <View style={{ position: "absolute", top: 0, left: 0, width: W, height: H }}>
          {/* Goal line */}
          {goalWeight != null && (
            <View style={[styles.goalLine, {
              top: H - ((goalWeight - min) / range) * H,
              backgroundColor: "#22c55e",
            }]} />
          )}
          {/* Dots */}
          {pts.map((p, i) => (
            <View key={i} style={[styles.dot, { left: p.x - 4, top: p.y - 4, backgroundColor: i === pts.length - 1 ? colors.primary : colors.primary + "60" }]} />
          ))}
        </View>
        {/* Labels */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: H + 6 }}>
          <Text style={[styles.axisLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
            {pts[0] ? new Date(pts[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
          </Text>
          <Text style={[styles.axisLabel, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>
            {pts[pts.length - 1]?.weight}{unit}
          </Text>
          {goalWeight != null && (
            <Text style={[styles.axisLabel, { color: "#22c55e", fontFamily: "Outfit_400Regular" }]}>
              Goal: {goalWeight}{unit}
            </Text>
          )}
        </View>
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
  const { data: profile } = useGetProfile();
  const { data: weightLogs } = useListWeightLogs();
  const createWeightLog = useCreateWeightLog();
  const updateProfile = useUpdateProfile();
  const aiWeightAdvice = useAiWeightAdvice();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [showAiAdvice, setShowAiAdvice] = useState(false);

  const unit = profile?.weightUnit ?? "kg";
  const currentWeight = weightLogs?.[0]?.weight ?? profile?.weight;
  const goalWeight = profile?.weightGoal;

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w)) return;
    await createWeightLog.mutateAsync({ data: { weight: w, unit } });
    await updateProfile.mutateAsync({ data: { weight: w } });
    setNewWeight("");
    setShowWeightModal(false);
  };

  const handleSetGoal = async () => {
    const g = parseFloat(newGoal);
    if (isNaN(g)) return;
    await updateProfile.mutateAsync({ data: { weightGoal: g } });
    setNewGoal("");
    setShowGoalModal(false);
  };

  const handleGetAiAdvice = () => {
    if (!currentWeight || !goalWeight || !profile) return;
    aiWeightAdvice.mutate({
      data: {
        currentWeight,
        goalWeight,
        unit,
        fitnessGoal: profile.fitnessGoal,
        fitnessLevel: profile.fitnessLevel,
        weeklyWorkouts: profile.weeklyWorkoutTarget,
      },
    });
    setShowAiAdvice(true);
  };

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
                { label: "Workouts", value: summary?.totalWorkouts ?? 0, icon: "activity" },
                { label: "Streak", value: `${summary?.currentStreak ?? 0}d`, icon: "zap", accent: true },
                { label: "Best Streak", value: `${summary?.longestStreak ?? 0}d`, icon: "award" },
                { label: "Hours", value: Math.round((summary?.totalMinutes ?? 0) / 60), icon: "clock" },
              ].map((s) => (
                <View key={s.label} style={[styles.statBox, { backgroundColor: s.accent ? colors.primary + "15" : colors.card, borderColor: s.accent ? colors.primary + "40" : colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: s.accent ? colors.primary + "25" : colors.muted }]}>
                    <Feather name={s.icon as never} size={14} color={s.accent ? colors.primary : colors.mutedForeground} />
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

            {/* Weight Goal Card */}
            <View style={[styles.weightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={[colors.primary + "10", "transparent"]} style={StyleSheet.absoluteFill} />
              <View style={styles.weightHeader}>
                <View>
                  <Text style={[styles.weightTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    Weight Goal
                  </Text>
                  <View style={styles.weightRow}>
                    <View style={styles.weightStat}>
                      <Text style={[styles.weightStatLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>Current</Text>
                      <Text style={[styles.weightStatValue, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                        {currentWeight ? `${currentWeight}${unit}` : "—"}
                      </Text>
                    </View>
                    <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
                    <View style={styles.weightStat}>
                      <Text style={[styles.weightStatLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>Goal</Text>
                      <Text style={[styles.weightStatValue, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>
                        {goalWeight ? `${goalWeight}${unit}` : "Set goal"}
                      </Text>
                    </View>
                    {currentWeight && goalWeight && (
                      <>
                        <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
                        <View style={styles.weightStat}>
                          <Text style={[styles.weightStatLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>To go</Text>
                          <Text style={[styles.weightStatValue, { color: goalWeight < currentWeight ? "#22c55e" : "#f59e0b", fontFamily: "Outfit_700Bold" }]}>
                            {Math.abs(goalWeight - currentWeight).toFixed(1)}{unit}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.weightActions}>
                <TouchableOpacity style={[styles.weightBtn, { borderColor: colors.border, backgroundColor: colors.muted }]} onPress={() => setShowWeightModal(true)}>
                  <Feather name="plus" size={13} color={colors.foreground} />
                  <Text style={[styles.weightBtnText, { color: colors.foreground, fontFamily: "Outfit_500Medium" }]}>Log Weight</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.weightBtn, { borderColor: colors.border, backgroundColor: colors.muted }]} onPress={() => setShowGoalModal(true)}>
                  <Feather name="target" size={13} color={colors.foreground} />
                  <Text style={[styles.weightBtnText, { color: colors.foreground, fontFamily: "Outfit_500Medium" }]}>Set Goal</Text>
                </TouchableOpacity>
                {currentWeight && goalWeight && (
                  <TouchableOpacity
                    style={[styles.weightBtn, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "15" }]}
                    onPress={handleGetAiAdvice}
                    disabled={aiWeightAdvice.isPending}
                  >
                    <Feather name="cpu" size={13} color={colors.primary} />
                    <Text style={[styles.weightBtnText, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>AI Plan</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* AI Advice */}
              {showAiAdvice && (
                <View style={[styles.aiAdvice, { borderColor: colors.primary + "30", backgroundColor: colors.primary + "08" }]}>
                  {aiWeightAdvice.isPending ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : aiWeightAdvice.data ? (
                    <>
                      <View style={styles.aiAdviceHeader}>
                        <Feather name="cpu" size={12} color={colors.primary} />
                        <Text style={[styles.aiAdviceTitle, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>AI Coach Plan</Text>
                        <Pressable onPress={() => setShowAiAdvice(false)} style={{ marginLeft: "auto" }}>
                          <Feather name="x" size={14} color={colors.mutedForeground} />
                        </Pressable>
                      </View>
                      <Text style={[styles.aiAdviceText, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}>
                        {aiWeightAdvice.data.advice}
                      </Text>
                    </>
                  ) : null}
                </View>
              )}
            </View>

            {/* Weight Chart */}
            {weightLogs && weightLogs.length > 0 && (
              <WeightChart data={weightLogs} unit={unit} goalWeight={goalWeight} colors={colors} />
            )}

            {/* Weekly Chart */}
            {weekly && weekly.length > 0 && <WeeklyChart data={weekly} colors={colors} />}

            {/* Volume */}
            {(summary?.totalVolume ?? 0) > 0 && (
              <View style={[styles.volumeBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.volumeLabel, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>Total Volume Lifted</Text>
                  <Text style={[styles.volumeValue, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>
                    {(summary!.totalVolume / 1000).toFixed(1)}t
                  </Text>
                </View>
                <View style={[styles.volumeIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="trending-up" size={28} color={colors.primary} />
                </View>
              </View>
            )}

            {/* Personal Records */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                Personal Records
              </Text>
              {prs && prs.length > 0 ? (
                prs.map((pr, idx) => (
                  <View key={pr.exerciseId} style={[styles.prCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {idx === 0 && <LinearGradient colors={[colors.primary + "12", "transparent"]} style={StyleSheet.absoluteFill} />}
                    <View style={[styles.prRank, { backgroundColor: idx === 0 ? colors.primary + "25" : colors.muted }]}>
                      <Text style={[styles.prRankText, { color: idx === 0 ? colors.primary : colors.mutedForeground, fontFamily: "Outfit_700Bold" }]}>
                        {idx === 0 ? "🏆" : `#${idx + 1}`}
                      </Text>
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
                ))
              ) : (
                <View style={[styles.emptyCard, { borderColor: colors.border }]}>
                  <Feather name="award" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    Log workouts with weights to see personal records
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal visible={showWeightModal} transparent animationType="slide" onRequestClose={() => setShowWeightModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowWeightModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>Log Weight</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder={`Weight in ${unit}`}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={handleLogWeight}
              disabled={createWeightLog.isPending}
            >
              <Text style={[styles.modalBtnText, { fontFamily: "Outfit_600SemiBold" }]}>
                {createWeightLog.isPending ? "Saving..." : `Save ${newWeight || "—"}${unit}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Set Goal Modal */}
      <Modal visible={showGoalModal} transparent animationType="slide" onRequestClose={() => setShowGoalModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoalModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>Set Weight Goal</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder={`Target weight in ${unit}`}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={newGoal}
              onChangeText={setNewGoal}
            />
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={handleSetGoal}
              disabled={updateProfile.isPending}
            >
              <Text style={[styles.modalBtnText, { fontFamily: "Outfit_600SemiBold" }]}>
                {updateProfile.isPending ? "Saving..." : `Set goal to ${newGoal || "—"}${unit}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, marginBottom: 20 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statBox: { flex: 1, minWidth: "45%", borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 24 },
  statLbl: { fontSize: 11 },
  weightCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 16, overflow: "hidden" },
  weightHeader: { marginBottom: 14 },
  weightTitle: { fontSize: 15, marginBottom: 12 },
  weightRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  weightStat: { alignItems: "center" },
  weightStatLabel: { fontSize: 11, marginBottom: 4 },
  weightStatValue: { fontSize: 20 },
  weightActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  weightBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  weightBtnText: { fontSize: 13 },
  aiAdvice: { marginTop: 14, borderRadius: 12, borderWidth: 1, padding: 14 },
  aiAdviceHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  aiAdviceTitle: { fontSize: 13 },
  aiAdviceText: { fontSize: 13, lineHeight: 20 },
  chartBox: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 15, marginBottom: 16 },
  chartArea: { flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT + 24, gap: 2 },
  barGroup: { alignItems: "center", justifyContent: "flex-end", height: CHART_HEIGHT + 20 },
  bar: { marginBottom: 6, borderRadius: 6 },
  barLabel: { fontSize: 8, textAlign: "center" },
  goalLine: { position: "absolute", left: 0, right: 0, height: 1.5, opacity: 0.8 },
  dot: { position: "absolute", width: 8, height: 8, borderRadius: 4 },
  axisLabel: { fontSize: 11 },
  volumeBox: { borderRadius: 16, borderWidth: 1, padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  volumeLabel: { fontSize: 13 },
  volumeValue: { fontSize: 34, marginTop: 4 },
  volumeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, marginBottom: 12 },
  prCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: "hidden" },
  prRank: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  prRankText: { fontSize: 14 },
  prName: { fontSize: 14 },
  prMeta: { fontSize: 12, marginTop: 2 },
  prWeight: { fontSize: 18 },
  prReps: { fontSize: 12 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12, marginTop: 8 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: { borderRadius: 24, borderWidth: 1, padding: 24, margin: 16, gap: 16 },
  modalTitle: { fontSize: 20 },
  modalInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 16 },
  modalBtn: { borderRadius: 14, padding: 16, alignItems: "center" },
  modalBtnText: { fontSize: 16, color: "#000" },
});
