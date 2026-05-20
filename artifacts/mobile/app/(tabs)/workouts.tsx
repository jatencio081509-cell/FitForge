import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  useListWorkouts,
  useCreateWorkout,
  useDeleteWorkout,
  useAiSuggestExercises,
} from "@workspace/api-client-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

const FILTERS = ["All", "strength", "cardio", "flexibility"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const CATEGORIES = ["strength", "cardio", "flexibility", "mixed"];

export default function WorkoutsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", difficulty: "beginner",
    estimatedMinutes: "45", category: "strength",
  });

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const { data: workouts, isLoading, refetch } = useListWorkouts();
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const suggestMutation = useAiSuggestExercises();

  const filtered = workouts?.filter((w) => filter === "All" || w.category === filter);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await createWorkout.mutateAsync({
      data: {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        difficulty: form.difficulty,
        estimatedMinutes: parseInt(form.estimatedMinutes, 10) || 45,
        category: form.category,
      },
    });
    refetch();
    setShowCreateModal(false);
    setForm({ name: "", description: "", difficulty: "beginner", estimatedMinutes: "45", category: "strength" });
  };

  const handleDelete = (id: number, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Workout", `Delete "${name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await deleteWorkout.mutateAsync({ id });
          refetch();
        },
      },
    ]);
  };

  const handleAiSearch = () => {
    if (!aiQuery.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    suggestMutation.mutate({ data: { query: aiQuery.trim() } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>Workouts</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); setShowAiModal(true); suggestMutation.reset(); setAiQuery(""); }}
          >
            <Feather name="cpu" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCreateModal(true); }}
          >
            <Feather name="plus" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* Filter row */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, { backgroundColor: filter === f ? colors.primary : colors.card, borderColor: filter === f ? colors.primary : colors.border }]}
            onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
          >
            <Text style={[styles.chipText, { color: filter === f ? "#000" : colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>
              {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(w) => String(w.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomPadding + 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="zap" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>No workouts here</Text>
              <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
                <Text style={[styles.emptyBtnText, { fontFamily: "Outfit_600SemiBold" }]}>Create Workout</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item: w }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.87 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/workout/${w.id}` as never); }}
            >
              {w.isAiGenerated && (
                <LinearGradient colors={[colors.primary + "12", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>{w.name}</Text>
                  {w.description ? (
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]} numberOfLines={1}>{w.description}</Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  <Pressable
                    hitSlop={10}
                    onPress={() => handleDelete(w.id, w.name)}
                    style={[styles.deleteBtn, { backgroundColor: colors.muted }]}
                  >
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                  </Pressable>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              </View>
              <View style={styles.cardMeta}>
                <View style={[styles.diffPill, { backgroundColor: (DIFFICULTY_COLORS[w.difficulty] ?? "#6b7280") + "22" }]}>
                  <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[w.difficulty] ?? "#6b7280", fontFamily: "Outfit_600SemiBold" }]}>
                    {w.difficulty}
                  </Text>
                </View>
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  {w.estimatedMinutes}m
                </Text>
                {w.exerciseCount != null && (
                  <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    · {w.exerciseCount} exercises
                  </Text>
                )}
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCreateModal(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>New Workout</Text>

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Name</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: form.name ? colors.primary + "60" : colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder="e.g. Push Day" placeholderTextColor={colors.mutedForeground}
              value={form.name} onChangeText={v => setForm({ ...form, name: v })} />

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Description</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder="Optional..." placeholderTextColor={colors.mutedForeground}
              value={form.description} onChangeText={v => setForm({ ...form, description: v })} />

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Duration (min)</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder="45" placeholderTextColor={colors.mutedForeground} keyboardType="number-pad"
              value={form.estimatedMinutes} onChangeText={v => setForm({ ...form, estimatedMinutes: v })} />

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Difficulty</Text>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map(d => (
                <Pressable key={d} onPress={() => { Haptics.selectionAsync(); setForm({ ...form, difficulty: d }); }}
                  style={[styles.selectChip, { backgroundColor: form.difficulty === d ? (DIFFICULTY_COLORS[d] + "25") : colors.background, borderColor: form.difficulty === d ? DIFFICULTY_COLORS[d] : colors.border }]}>
                  <Text style={[styles.chipText, { color: form.difficulty === d ? DIFFICULTY_COLORS[d] : colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <Pressable key={c} onPress={() => { Haptics.selectionAsync(); setForm({ ...form, category: c }); }}
                  style={[styles.selectChip, { backgroundColor: form.category === c ? colors.primary + "20" : colors.background, borderColor: form.category === c ? colors.primary : colors.border }]}>
                  <Text style={[styles.chipText, { color: form.category === c ? colors.primary : colors.mutedForeground, fontFamily: "Outfit_500Medium" }]}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: form.name.trim() ? colors.primary : colors.muted, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleCreate} disabled={!form.name.trim() || createWorkout.isPending}
            >
              {createWorkout.isPending ? <ActivityIndicator color="#000" />
                : <Text style={[styles.submitText, { color: form.name.trim() ? "#000" : colors.mutedForeground, fontFamily: "Outfit_600SemiBold" }]}>Create</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* AI Modal */}
      <Modal visible={showAiModal} transparent animationType="slide" onRequestClose={() => setShowAiModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowAiModal(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <View style={styles.aiHeader}>
              <View style={[styles.aiIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="cpu" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold", marginBottom: 0 }]}>AI Exercise Finder</Text>
                <Text style={[styles.aiSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>Describe what you want to train</Text>
              </View>
            </View>
            <View style={[styles.aiInputRow, { backgroundColor: colors.background, borderColor: suggestMutation.isPending ? colors.primary + "60" : colors.border }]}>
              <TextInput
                style={[styles.aiInput, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
                placeholder='"burn fat", "big chest", "no equipment"'
                placeholderTextColor={colors.mutedForeground}
                value={aiQuery} onChangeText={setAiQuery}
                onSubmitEditing={handleAiSearch} returnKeyType="search" autoFocus
              />
              <Pressable style={[styles.aiBtn, { backgroundColor: aiQuery.trim() ? colors.primary : colors.muted }]} onPress={handleAiSearch} disabled={suggestMutation.isPending}>
                {suggestMutation.isPending ? <ActivityIndicator size="small" color="#000" /> : <Feather name="search" size={15} color={aiQuery.trim() ? "#000" : colors.mutedForeground} />}
              </Pressable>
            </View>
            {suggestMutation.data?.exercises.map((ex) => (
              <View key={ex.id} style={[styles.aiResult, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.aiResultIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="activity" size={13} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiResultName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>{ex.name}</Text>
                  <Text style={[styles.aiResultMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>{ex.muscleGroup} · {ex.equipment}</Text>
                </View>
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 28 },
  headerActions: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardName: { fontSize: 15 },
  cardDesc: { fontSize: 12, marginTop: 2 },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  diffPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffText: { fontSize: 11 },
  metaText: { fontSize: 12 },
  empty: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 10, marginTop: 24 },
  emptyText: { fontSize: 14 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  emptyBtnText: { fontSize: 14, color: "#000" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { borderRadius: 24, borderWidth: 1, padding: 24, margin: 12, gap: 10, maxHeight: "85%" },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 4 },
  sheetTitle: { fontSize: 22, marginBottom: 4 },
  label: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  selectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  submitText: { fontSize: 16 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  aiIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  aiSub: { fontSize: 12, marginTop: 2 },
  aiInputRow: { flexDirection: "row", borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  aiInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  aiBtn: { padding: 12, alignItems: "center", justifyContent: "center", width: 48 },
  aiResult: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  aiResultIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  aiResultName: { fontSize: 13 },
  aiResultMeta: { fontSize: 11, marginTop: 1 },
});
