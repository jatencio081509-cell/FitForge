import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useListWorkouts, useAiSuggestExercises } from "@workspace/api-client-react";

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
};

const FILTERS = ["All", "strength", "cardio", "flexibility"];

export default function WorkoutsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [aiQuery, setAiQuery] = useState("");
  const [showAiSearch, setShowAiSearch] = useState(false);

  const { data: workouts, isLoading } = useListWorkouts();
  const suggestMutation = useAiSuggestExercises();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const filtered = workouts?.filter((w) => filter === "All" || w.category === filter);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    suggestMutation.mutate({ data: { query: aiQuery.trim() } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
          Workouts
        </Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.iconBtn, { backgroundColor: showAiSearch ? colors.primary + "20" : colors.card, borderColor: showAiSearch ? colors.primary + "40" : colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowAiSearch((v) => !v);
              suggestMutation.reset();
              setAiQuery("");
            }}
          >
            <Feather name="cpu" size={18} color={showAiSearch ? colors.primary : colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/workout/new" as never);
            }}
          >
            <Feather name="plus" size={20} color="#000" />
          </Pressable>
        </View>
      </View>

      {/* AI Exercise Finder */}
      {showAiSearch && (
        <View style={[styles.aiPanel, { backgroundColor: colors.card, borderColor: colors.primary + "30", marginHorizontal: 20, marginBottom: 12 }]}>
          <LinearGradient colors={[colors.primary + "12", "transparent"]} style={StyleSheet.absoluteFill} />
          <View style={styles.aiPanelHeader}>
            <Feather name="cpu" size={14} color={colors.primary} />
            <Text style={[styles.aiPanelTitle, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>
              AI Exercise Finder
            </Text>
          </View>
          <Text style={[styles.aiPanelSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
            Describe what you want — e.g. "burn fat fast", "big chest", "no equipment back"
          </Text>
          <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholder="Ask AI for exercises..."
              placeholderTextColor={colors.mutedForeground}
              value={aiQuery}
              onChangeText={setAiQuery}
              onSubmitEditing={handleAiSearch}
              returnKeyType="search"
            />
            <Pressable
              style={[styles.searchBtn, { backgroundColor: colors.primary, opacity: suggestMutation.isPending ? 0.6 : 1 }]}
              onPress={handleAiSearch}
              disabled={suggestMutation.isPending}
            >
              {suggestMutation.isPending
                ? <ActivityIndicator size="small" color="#000" />
                : <Feather name="search" size={16} color="#000" />}
            </Pressable>
          </View>

          {suggestMutation.data && (
            <View style={styles.aiResults}>
              <Text style={[styles.aiExplanation, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                {suggestMutation.data.explanation}
              </Text>
              {suggestMutation.data.exercises.map((ex) => (
                <View key={ex.id} style={[styles.aiExCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[styles.aiExIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="activity" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.aiExName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                      {ex.name}
                    </Text>
                    <Text style={[styles.aiExMeta, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {ex.muscleGroup} · {ex.equipment}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, {
              backgroundColor: filter === f ? colors.primary : colors.card,
              borderColor: filter === f ? colors.primary : colors.border,
            }]}
            onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
          >
            <Text style={[styles.filterText, {
              color: filter === f ? "#000" : colors.mutedForeground,
              fontFamily: "Outfit_500Medium",
            }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: bottomPadding + 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="zap" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                No workouts found
              </Text>
            </View>
          }
          renderItem={({ item: w }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/workout/${w.id}` as never);
              }}
            >
              {w.isAiGenerated && (
                <LinearGradient
                  colors={[colors.primary + "12", "transparent"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    {w.name}
                  </Text>
                  {w.description && (
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]} numberOfLines={2}>
                      {w.description}
                    </Text>
                  )}
                </View>
                {w.isAiGenerated && (
                  <View style={[styles.aiBadge, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                    <Feather name="cpu" size={11} color={colors.primary} />
                    <Text style={[styles.aiBadgeText, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>AI</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardMeta}>
                <View style={[styles.diffBadge, { backgroundColor: (DIFFICULTY_COLORS[w.difficulty] ?? "#6b7280") + "25" }]}>
                  <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[w.difficulty] ?? "#6b7280", fontFamily: "Outfit_600SemiBold" }]}>
                    {w.difficulty}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    {w.estimatedMinutes} min
                  </Text>
                </View>
                {w.exerciseCount != null && (
                  <View style={styles.metaItem}>
                    <Feather name="list" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {w.exerciseCount} exercises
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28 },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  aiPanel: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: "hidden" },
  aiPanelHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  aiPanelTitle: { fontSize: 14 },
  aiPanelSub: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  searchRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  searchInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  searchBtn: { padding: 12, alignItems: "center", justifyContent: "center", width: 44 },
  aiResults: { marginTop: 12, gap: 8 },
  aiExplanation: { fontSize: 12, lineHeight: 18, marginBottom: 4, fontStyle: "italic" },
  aiExCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  aiExIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  aiExName: { fontSize: 13 },
  aiExMeta: { fontSize: 11, marginTop: 1 },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13 },
  card: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 12, overflow: "hidden" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  cardName: { fontSize: 16, lineHeight: 22 },
  cardDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  aiBadgeText: { fontSize: 11 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
  empty: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 10, marginTop: 24 },
  emptyText: { fontSize: 14 },
});
