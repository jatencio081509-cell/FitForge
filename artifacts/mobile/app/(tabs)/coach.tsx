import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { fetch as expoFetch } from "expo/fetch";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTERS = [
  { label: "Build me a 3-day workout plan", icon: "calendar" },
  { label: "How do I build muscle faster?", icon: "trending-up" },
  { label: "What should I eat after a workout?", icon: "heart" },
  { label: "Help me improve my squat form", icon: "activity" },
];

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const tabBarH = Platform.OS === "web" ? 84 : 83;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages((prev) => [userMsg, ...prev]);
    setInput("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await expoFetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = (await res.json()) as { reply: string };
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [assistantMsg, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't reach the AI coach right now. Try again.",
      };
      setMessages((prev) => [errMsg, ...prev]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary + "20", "transparent"]}
        style={[styles.headerGrad, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.header}>
          <View style={[styles.coachAvatar, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={20} color="#000" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
              AI Coach
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: "#22c55e" }]} />
              <Text style={[styles.statusText, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                Online · Powered by OpenRouter
              </Text>
            </View>
          </View>
          {messages.length > 0 && (
            <Pressable
              style={[styles.clearBtn, { backgroundColor: colors.muted }]}
              onPress={() => { Haptics.selectionAsync(); setMessages([]); }}
            >
              <Feather name="trash-2" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={flatRef}
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            loading ? (
              <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.primary, opacity: 0.3 }]} />
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            messages.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[colors.primary + "25", colors.primary + "08"]}
                  style={styles.emptyIcon}
                >
                  <Feather name="cpu" size={32} color={colors.primary} />
                </LinearGradient>
                <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
                  Your AI Fitness Coach
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  Ask about workouts, nutrition, recovery, or anything fitness-related
                </Text>
                <View style={styles.starters}>
                  {STARTERS.map((s) => (
                    <Pressable
                      key={s.label}
                      style={({ pressed }) => [styles.starterBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => sendMessage(s.label)}
                    >
                      <View style={[styles.starterIcon, { backgroundColor: colors.primary + "20" }]}>
                        <Feather name={s.icon as never} size={13} color={colors.primary} />
                      </View>
                      <Text style={[styles.starterText, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}>
                        {s.label}
                      </Text>
                      <Feather name="arrow-up-right" size={13} color={colors.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null
          }
          renderItem={({ item: msg }) => (
            <View style={[
              styles.bubble,
              msg.role === "user"
                ? [styles.userBubble, { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }]
                : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }],
            ]}>
              {msg.role === "assistant" && (
                <View style={[styles.assistantBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="cpu" size={9} color={colors.primary} />
                  <Text style={[styles.assistantBadgeText, { color: colors.primary, fontFamily: "Outfit_600SemiBold" }]}>Coach</Text>
                </View>
              )}
              <Text style={[styles.bubbleText, {
                color: msg.role === "user" ? "#000" : colors.foreground,
                fontFamily: "Outfit_400Regular",
              }]}>
                {msg.content}
              </Text>
            </View>
          )}
        />

        {/* Input bar */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: bottomInset + tabBarH + 8,
        }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: input.trim() ? colors.primary + "60" : colors.border }]}>
            <TextInput
              style={[styles.inputField, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="Ask anything about fitness..."
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted, shadowColor: colors.primary, shadowOpacity: input.trim() ? 0.4 : 0, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }]}
              onPress={() => sendMessage(input)}
              disabled={loading || !input.trim()}
            >
              <Feather name="send" size={15} color={input.trim() ? "#000" : colors.mutedForeground} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  coachAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11 },
  clearBtn: { marginLeft: "auto", padding: 10, borderRadius: 10 },
  bubble: { maxWidth: "82%", borderRadius: 18, padding: 14, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end", borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: "flex-start", borderWidth: 1, borderBottomLeftRadius: 4 },
  assistantBadge: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
  assistantBadgeText: { fontSize: 10 },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  typingDots: { flexDirection: "row", gap: 4, padding: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 20, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 22, textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20, maxWidth: 260 },
  starters: { width: "100%", gap: 8, marginTop: 4 },
  starterBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  starterIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  starterText: { fontSize: 13, flex: 1 },
  inputBar: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  inputWrapper: { flexDirection: "row", alignItems: "flex-end", borderRadius: 24, borderWidth: 1.5, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, gap: 8 },
  inputField: { flex: 1, fontSize: 14, maxHeight: 120, paddingVertical: 6 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
