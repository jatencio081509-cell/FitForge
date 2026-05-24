import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useListExercises, useAiSuggestExercises } from "@workspace/api-client-react";
import type { MuscleGroup } from "@/components/MuscleFigure";

const MUSCLE_INFO: Record<string, { label: string; emoji: string; desc: string; tips: string[] }> = {
  chest: {
    label: "Chest",
    emoji: "💪",
    desc: "The pectoralis major and minor — key for pushing movements, shoulder stability, and upper body power.",
    tips: ["Focus on full range of motion", "Mind-muscle connection is crucial", "Don't flare elbows on pressing movements"],
  },
  back: {
    label: "Back",
    emoji: "🦾",
    desc: "Lats, traps, and rhomboids — essential for pulling movements, posture, and spinal support.",
    tips: ["Retract shoulder blades before pulling", "Engage lats by thinking 'elbows to hips'", "Don't shrug your shoulders"],
  },
  legs: {
    label: "Legs",
    emoji: "🦵",
    desc: "Quads, hamstrings, glutes, and calves — the foundation of athletic performance and metabolic health.",
    tips: ["Keep knees tracking over toes", "Drive through heels on squats", "Don't neglect posterior chain (hamstrings/glutes)"],
  },
  shoulders: {
    label: "Shoulders",
    emoji: "🏋️",
    desc: "Anterior, medial, and posterior deltoids — critical for overhead movement and shoulder health.",
    tips: ["Train all 3 heads equally", "Prioritize rear delts for posture", "Avoid impingement with proper warm-up"],
  },
  arms: {
    label: "Arms",
    emoji: "💪",
    desc: "Biceps, triceps, and forearms — supporting every push and pull movement while adding visible definition.",
    tips: ["Supinate wrist at peak for bicep contraction", "Lock elbows on isolation exercises", "Triceps are 2/3 of arm size"],
  },
  core: {
    label: "Core",
    emoji: "🔥",
    desc: "Abs, obliques, and deep stabilizers — the center of all movement and spine protection.",
    tips: ["Brace like you're about to take a punch", "Exhale forcefully on contraction", "Train anti-rotation, not just flexion"],
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  strength: "zap",
  cardio: "heart",
  flexibility: "activity",
};

export default function MuscleDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { group } = useLocalSearchParams<{ group: string }>();

  const muscleGroup = (group ?? "chest") as MuscleGroup;
  const info = MUSCLE_INFO[muscleGroup] ?? MUSCLE_INFO.chest;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const { data: exercises, isLoading } = useListExercises({ muscle: muscleGroup });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary + "28", colors.primary + "08", "transparent"]}
          style={[styles.hero, { paddingTop: topPadding + 12 }]}
        >
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroEmoji}>{info.emoji}</Text>
              <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                {info.label}
              </Text>
              <Text style={[styles.heroDesc, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                {info.desc}
              </Text>
            </View>
            <View style={[styles.heroFigure, { backgroundColor: colors.primary + "20", borderRadius: 20, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 40 }}>{info.emoji}</Text>
            </View>
          </View>

          {/* Tips */}
          <View style={[styles.tipsCard, { backgroundColor: colors.card + "CC", borderColor: colors.border }]}>
            <View style={styles.tipsHeader}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[styles.tipsLabel, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>
                Coach Tips
              </Text>
            </View>
            {info.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
            {exercises?.length ?? "..."} Exercises for {info.label}
          </Text>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : exercises && exercises.length > 0 ? (
            exercises.map((ex, idx) => (
              <View key={ex.id} style={[styles.exCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {idx === 0 && <LinearGradient colors={[colors.primary + "12", "transparent"]} style={StyleSheet.absoluteFill} />}
                <View style={[styles.exNum, { backgroundColor: idx === 0 ? colors.primary + "25" : colors.muted }]}>
                  <Text style={[styles.exNumText, { color: idx === 0 ? colors.primary : colors.mutedForeground, fontFamily: "Outfit_700Bold" }]}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    {ex.name}
                  </Text>
                  <View style={styles.exMeta}>
                    <View style={[styles.exBadge, { backgroundColor: colors.muted }]}>
                      <Feather name={(CATEGORY_ICONS[ex.category] ?? "activity") as never} size={10} color={colors.mutedForeground} />
                      <Text style={[styles.exBadgeText, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>
                        {ex.category}
                      </Text>
                    </View>
                    <View style={[styles.exBadge, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.exBadgeText, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>
                        {ex.equipment}
                      </Text>
                    </View>
                  </View>
                  {ex.description && (
                    <Text style={[styles.exDesc, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]} numberOfLines={2}>
                      {ex.description}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="inbox" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                No exercises found for this muscle group
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1, alignSelf: "flex-start", marginBottom: 20 },
  heroContent: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  heroLeft: { flex: 1 },
  heroEmoji: { fontSize: 36, marginBottom: 8 },
  heroTitle: { fontSize: 32, lineHeight: 38 },
  heroDesc: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  heroFigure: { marginTop: -10 },
  tipsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  tipsLabel: { fontSize: 13 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipText: { fontSize: 13, lineHeight: 20, flex: 1 },
  exercisesSection: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 17, marginBottom: 16 },
  exCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, overflow: "hidden" },
  exNum: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  exNumText: { fontSize: 14 },
  exName: { fontSize: 15, marginBottom: 8 },
  exMeta: { flexDirection: "row", gap: 6, marginBottom: 6 },
  exBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  exBadgeText: { fontSize: 11 },
  exDesc: { fontSize: 12, lineHeight: 18 },
  empty: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 12, marginTop: 8 },
  emptyText: { fontSize: 13, textAlign: "center" },
});
