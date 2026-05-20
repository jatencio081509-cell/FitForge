import { Feather } from "@expo/vector-icons";
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
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useListWorkouts } from "@workspace/api-client-react";

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

  const { data: workouts, isLoading } = useListWorkouts();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 + 84 : insets.bottom + 83;

  const filtered = workouts?.filter(
    (w) => filter === "All" || w.category === filter
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
          Workouts
        </Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/workout/new" as never);
          }}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === f ? colors.primary : colors.card,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setFilter(f);
            }}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === f ? colors.primaryForeground : colors.mutedForeground,
                  fontFamily: "Outfit_500Medium",
                },
              ]}
            >
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
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: bottomPadding + 16,
          }}
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
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/workout/${w.id}` as never);
              }}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                    {w.name}
                  </Text>
                  {w.description && (
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                      {w.description}
                    </Text>
                  )}
                </View>
                {w.isAiGenerated && (
                  <View style={[styles.aiBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="cpu" size={11} color={colors.primary} />
                    <Text style={[styles.aiBadgeText, { color: colors.primary, fontFamily: "Outfit_500Medium" }]}>AI</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardMeta}>
                <View style={[styles.diffBadge, { backgroundColor: (DIFFICULTY_COLORS[w.difficulty] ?? "#6b7280") + "25" }]}>
                  <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[w.difficulty] ?? "#6b7280", fontFamily: "Outfit_500Medium" }]}>
                    {w.difficulty}
                  </Text>
                </View>
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  <Feather name="clock" size={12} /> {w.estimatedMinutes} min
                </Text>
                {w.exerciseCount != null && (
                  <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                    <Feather name="list" size={12} /> {w.exerciseCount} exercises
                  </Text>
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
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  cardName: { fontSize: 16 },
  cardDesc: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  aiBadgeText: { fontSize: 11 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 12 },
  metaText: { fontSize: 12 },
  empty: { padding: 40, borderRadius: 16, borderWidth: 1, alignItems: "center", gap: 10, marginTop: 24 },
  emptyText: { fontSize: 14 },
});
