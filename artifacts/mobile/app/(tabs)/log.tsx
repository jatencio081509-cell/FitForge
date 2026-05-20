import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  useCreateWorkoutLog,
  useListWorkouts,
} from "@workspace/api-client-react";

const RATINGS = [1, 2, 3, 4, 5];

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const { data: workouts } = useListWorkouts();
  const { mutateAsync: createLog, isPending } = useCreateWorkoutLog();

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const selectedWorkout = workouts?.find((w) => w.id === selectedWorkoutId);

  async function handleSubmit() {
    if (!selectedWorkout) {
      Alert.alert("Select a workout", "Please choose a workout to log.");
      return;
    }
    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur <= 0) {
      Alert.alert("Invalid duration", "Enter a duration in minutes.");
      return;
    }

    try {
      await createLog({
        data: {
          workoutId: selectedWorkout.id,
          workoutName: selectedWorkout.name,
          completedAt: new Date().toISOString(),
          durationMinutes: dur,
          notes: notes || undefined,
          rating: rating ?? undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } catch {
      Alert.alert("Error", "Failed to log workout. Try again.");
    }
  }

  function handleReset() {
    setSelectedWorkoutId(null);
    setDuration("45");
    setNotes("");
    setRating(null);
    setDone(false);
  }

  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successBox, { paddingTop: topPadding + 40 }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="check-circle" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
            Workout Logged!
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
            Great work on completing {selectedWorkout?.name}
          </Text>
          <Pressable
            style={[styles.resetBtn, { backgroundColor: colors.primary }]}
            onPress={handleReset}
          >
            <Text style={[styles.resetBtnText, { color: colors.primaryForeground, fontFamily: "Outfit_600SemiBold" }]}>
              Log Another
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPadding + 16,
          paddingBottom: bottomPadding + 16,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
          Log Workout
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
          Record a completed session
        </Text>

        {/* Workout Selector */}
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
          Workout
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
          {workouts?.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[
                styles.workoutChip,
                {
                  backgroundColor: selectedWorkoutId === w.id ? colors.primary : colors.card,
                  borderColor: selectedWorkoutId === w.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedWorkoutId(w.id);
              }}
            >
              <Text
                style={[
                  styles.workoutChipText,
                  {
                    color: selectedWorkoutId === w.id ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Outfit_500Medium",
                  },
                ]}
              >
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Duration */}
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
          Duration (minutes)
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
          placeholderTextColor={colors.mutedForeground}
          placeholder="45"
          keyboardType="number-pad"
          value={duration}
          onChangeText={setDuration}
        />

        {/* Rating */}
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
          Rating
        </Text>
        <View style={styles.ratingRow}>
          {RATINGS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                Haptics.selectionAsync();
                setRating(r === rating ? null : r);
              }}
            >
              <Text style={[styles.star, { color: rating != null && r <= rating ? colors.primary : colors.border }]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notes */}
        <Text style={[styles.label, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
          Notes (optional)
        </Text>
        <TextInput
          style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
          placeholderTextColor={colors.mutedForeground}
          placeholder="How did it feel? Any PRs?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.submitText, { color: colors.primaryForeground, fontFamily: "Outfit_600SemiBold" }]}>
              Save Workout
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  label: { fontSize: 14, marginBottom: 10 },
  selectorRow: { marginBottom: 22 },
  workoutChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  workoutChipText: { fontSize: 13 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 22 },
  ratingRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  star: { fontSize: 32 },
  textarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 28, minHeight: 100 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  submitText: { fontSize: 16 },
  successBox: { flex: 1, alignItems: "center", paddingHorizontal: 32, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 28, marginTop: 8 },
  successSub: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  resetBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 12 },
  resetBtnText: { fontSize: 16 },
});
