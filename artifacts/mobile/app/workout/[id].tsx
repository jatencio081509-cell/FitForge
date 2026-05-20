import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGetWorkout, useCreateWorkoutLog } from "@workspace/api-client-react";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type SetState = "idle" | "done";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: workout, isLoading, isError } = useGetWorkout(Number(id), {
    query: { enabled: !!id && !isNaN(Number(id)) },
  });

  const createLog = useCreateWorkoutLog();

  const [sessionActive, setSessionActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sets, setSets] = useState<Record<string, SetState>>({});
  const [showFinish, setShowFinish] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = useCallback(() => {
    if (!workout) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const initial: Record<string, SetState> = {};
    workout.exercises.forEach(ex => {
      for (let i = 0; i < ex.sets; i++) initial[`${ex.id}-${i}`] = "idle";
    });
    setSets(initial);
    setElapsed(0);
    setSessionActive(true);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [workout]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const toggleSet = (key: string) => {
    Haptics.selectionAsync();
    setSets(prev => ({ ...prev, [key]: prev[key] === "done" ? "idle" : "done" }));
  };

  const doneSets = Object.values(sets).filter(s => s === "done").length;
  const totalSets = Object.keys(sets).length;

  const finishSession = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await createLog.mutateAsync({
      data: {
        workoutId: Number(id),
        workoutName: workout!.name,
        completedAt: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(elapsed / 60)),
        notes: notes || undefined,
        rating: rating || undefined,
      }
    });
    setShowFinish(false);
    router.back();
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !workout) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={32} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}>Workout not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Outfit_500Medium" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          {sessionActive && (
            <Text style={[styles.sessionLabel, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>LIVE SESSION</Text>
          )}
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]} numberOfLines={1}>
            {workout.name}
          </Text>
        </View>
        {sessionActive ? (
          <View style={[styles.timerBadge, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="clock" size={13} color={colors.primary} />
            <Text style={[styles.timerText, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>{formatTime(elapsed)}</Text>
          </View>
        ) : (
          <View style={[styles.metaBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaBadgeText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>{workout.estimatedMinutes}m</Text>
          </View>
        )}
      </View>

      {/* Progress bar (session only) */}
      {sessionActive && (
        <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` as never }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
            {doneSets}/{totalSets} sets
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding + 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Exercise cards */}
        <View style={styles.exerciseList}>
          {workout.exercises.sort((a, b) => a.orderIndex - b.orderIndex).map((ex, idx) => {
            const exSets = Array.from({ length: ex.sets }, (_, i) => `${ex.id}-${i}`);
            const exDone = exSets.filter(k => sets[k] === "done").length;
            const allDone = exDone === ex.sets;

            return (
              <View key={ex.id} style={[styles.exerciseCard, {
                backgroundColor: sessionActive && allDone ? colors.primary + "10" : colors.card,
                borderColor: sessionActive && allDone ? colors.primary + "50" : colors.border,
              }]}>
                <View style={styles.exHeader}>
                  <View style={[styles.exNum, { backgroundColor: sessionActive && allDone ? colors.primary : colors.muted }]}>
                    {sessionActive && allDone
                      ? <Feather name="check" size={14} color="#000" />
                      : <Text style={[styles.exNumText, { color: colors.mutedForeground, fontFamily: "Outfit_700Bold" }]}>{idx + 1}</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.exName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>{ex.exerciseName}</Text>
                    <Text style={[styles.exMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {ex.muscleGroup?.replace("_", " ")} · {ex.equipment}
                    </Text>
                  </View>
                  <View style={[styles.exStats, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.statCol}>
                      <Text style={[styles.statVal, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>{ex.sets}</Text>
                      <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>sets</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statCol}>
                      <Text style={[styles.statVal, { color: colors.primary, fontFamily: "Outfit_700Bold" }]}>{ex.reps}</Text>
                      <Text style={[styles.statLbl, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>reps</Text>
                    </View>
                  </View>
                </View>

                {/* Set checkboxes (session mode) */}
                {sessionActive && (
                  <View style={styles.setRow}>
                    {exSets.map((key, setIdx) => {
                      const done = sets[key] === "done";
                      return (
                        <Pressable
                          key={key}
                          onPress={() => toggleSet(key)}
                          style={[styles.setBtn, {
                            backgroundColor: done ? colors.primary : colors.background,
                            borderColor: done ? colors.primary : colors.border,
                          }]}
                        >
                          <Feather name={done ? "check-circle" : "circle"} size={13} color={done ? "#000" : colors.mutedForeground} />
                          <Text style={[styles.setBtnText, { color: done ? "#000" : colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>
                            Set {setIdx + 1}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                {ex.restSeconds != null && ex.restSeconds > 0 && (
                  <Text style={[styles.restText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    <Feather name="pause-circle" size={11} /> {ex.restSeconds}s rest
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {sessionActive ? (
          <Pressable
            style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => setShowFinish(true)}
          >
            <Feather name="check-circle" size={18} color="#000" />
            <Text style={[styles.ctaText, { color: "#000", fontFamily: "Outfit_700Bold" }]}>Finish Session</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={startSession}
          >
            <Feather name="play" size={18} color="#000" />
            <Text style={[styles.ctaText, { color: "#000", fontFamily: "Outfit_700Bold" }]}>Start Session</Text>
          </Pressable>
        )}
      </View>

      {/* Finish modal */}
      <Modal visible={showFinish} transparent animationType="slide" onRequestClose={() => setShowFinish(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFinish(false)}>
          <View style={[styles.finishSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.trophy}>
              <Feather name="award" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.finishTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>Session Complete!</Text>
            <Text style={[styles.finishSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
              {formatTime(elapsed)} · {doneSets}/{totalSets} sets completed
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Rate this session</Text>
            <View style={styles.stars}>
              {[1,2,3,4,5].map(n => (
                <Pressable key={n} onPress={() => { Haptics.selectionAsync(); setRating(n); }}>
                  <Feather name="star" size={32} color={n <= rating ? colors.primary : colors.border} />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder="How did it go?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />

            <Pressable
              style={({ pressed }) => [styles.cta, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
              onPress={finishSession}
              disabled={createLog.isPending}
            >
              {createLog.isPending
                ? <ActivityIndicator color="#000" />
                : <><Feather name="save" size={16} color="#000" /><Text style={[styles.ctaText, { color: "#000", fontFamily: "Outfit_700Bold" }]}>Save & Finish</Text></>
              }
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  sessionLabel: { fontSize: 10, letterSpacing: 1 },
  headerTitle: { fontSize: 18 },
  timerBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  timerText: { fontSize: 15 },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  metaBadgeText: { fontSize: 13 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 12, minWidth: 50, textAlign: "right" },
  exerciseList: { paddingHorizontal: 16, gap: 10 },
  exerciseCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  exHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  exNum: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  exNumText: { fontSize: 13 },
  exName: { fontSize: 15 },
  exMeta: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  exStats: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  statCol: { paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  statVal: { fontSize: 16 },
  statLbl: { fontSize: 10 },
  statDivider: { width: 1 },
  setRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  setBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  setBtnText: { fontSize: 13 },
  restText: { fontSize: 11, marginTop: 2 },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  cta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  ctaText: { fontSize: 16 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  finishSheet: { borderRadius: 24, borderWidth: 1, padding: 24, margin: 12, gap: 12, alignItems: "center" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", marginBottom: 8 },
  trophy: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(0,200,178,0.15)", alignItems: "center", justifyContent: "center" },
  finishTitle: { fontSize: 24 },
  finishSub: { fontSize: 14, marginBottom: 8 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, alignSelf: "flex-start" },
  stars: { flexDirection: "row", gap: 8, marginVertical: 4 },
  notesInput: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 80, textAlignVertical: "top" },
});
