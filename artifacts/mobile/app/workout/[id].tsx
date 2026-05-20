import { Feather } from "@expo/vector-icons";
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
import { useGetWorkout } from "@workspace/api-client-react";

const MUSCLE_ICONS: Record<string, string> = {
  chest: "triangle",
  back: "layers",
  legs: "arrow-down",
  shoulders: "chevrons-up",
  arms: "zap",
  core: "circle",
  full_body: "activity",
};

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
        <Text style={[styles.errorText, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}>
          Workout not found
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontFamily: "Outfit_500Medium" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const muscleGroups = [...new Set(workout.exercises.map((e) => e.muscleGroup))];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: bottomPadding + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: topPadding + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.heroName, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
            {workout.name}
          </Text>
          {workout.description && (
            <Text style={[styles.heroDesc, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
              {workout.description}
            </Text>
          )}
          <View style={styles.heroBadges}>
            <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="clock" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>
                {workout.estimatedMinutes} min
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="bar-chart-2" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>
                {workout.difficulty}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="list" size={12} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>
                {workout.exercises.length} exercises
              </Text>
            </View>
          </View>
          {muscleGroups.length > 0 && (
            <View style={styles.muscles}>
              {muscleGroups.map((m) => (
                <View key={m} style={[styles.musclePill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.musclePillText, { color: colors.secondaryForeground, fontFamily: "Outfit_500Medium" }]}>
                    {m?.replace("_", " ")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
            Exercises
          </Text>
          {workout.exercises
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((ex, idx) => (
              <View
                key={ex.id}
                style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.exNumBox, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.exNum, { color: colors.primaryForeground, fontFamily: "Outfit_700Bold" }]}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    {ex.exerciseName}
                  </Text>
                  <View style={styles.exMeta}>
                    <Text style={[styles.exMetaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {ex.sets} sets × {ex.reps} reps
                    </Text>
                    {ex.weight != null && (
                      <Text style={[styles.exMetaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                        · {ex.weight}kg
                      </Text>
                    )}
                    {ex.restSeconds != null && (
                      <Text style={[styles.exMetaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                        · {ex.restSeconds}s rest
                      </Text>
                    )}
                  </View>
                  {ex.muscleGroup && (
                    <Text style={[styles.exMuscle, { color: colors.primary, fontFamily: "Outfit_400Regular" }]}>
                      {ex.muscleGroup?.replace("_", " ")} · {ex.equipment}
                    </Text>
                  )}
                </View>
              </View>
            ))}
        </View>

        {/* Start Button */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/log" as never);
            }}
          >
            <Feather name="play" size={18} color={colors.primaryForeground} />
            <Text style={[styles.startBtnText, { color: colors.primaryForeground, fontFamily: "Outfit_600SemiBold" }]}>
              Start & Log Workout
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 16 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomWidth: 1 },
  backBtn: { marginBottom: 12 },
  heroName: { fontSize: 28, lineHeight: 34 },
  heroDesc: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  heroBadges: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 12 },
  muscles: { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  musclePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  musclePillText: { fontSize: 12, textTransform: "capitalize" },
  exercisesSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 17, marginBottom: 14 },
  exerciseCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  exNumBox: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  exNum: { fontSize: 14 },
  exName: { fontSize: 15 },
  exMeta: { flexDirection: "row", marginTop: 4, flexWrap: "wrap" },
  exMetaText: { fontSize: 13 },
  exMuscle: { fontSize: 12, marginTop: 4, textTransform: "capitalize" },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16 },
  startBtnText: { fontSize: 16 },
});
