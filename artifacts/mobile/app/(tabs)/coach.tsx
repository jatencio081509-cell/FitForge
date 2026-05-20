import { Feather } from "@expo/vector-icons";
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
  "Build me a 3-day workout plan",
  "How do I build muscle faster?",
  "What should I eat after a workout?",
  "Help me improve my squat form",
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
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };
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
      <View style={[styles.header, { paddingTop: topPadding + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.avatarDot, { backgroundColor: colors.primary }]} />
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Outfit_700Bold" }]}>
            AI Coach
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
            Powered by GPT-4o
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            loading ? (
              <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null
          }
          ListFooterComponent={
            messages.length === 0 ? (
              <View style={styles.startersContainer}>
                <View style={[styles.coachIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="cpu" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.startersTitle, { color: colors.foreground, fontFamily: "Outfit_600SemiBold" }]}>
                  Ask your AI Coach
                </Text>
                <Text style={[styles.startersSub, { color: colors.mutedForeground, fontFamily: "Outfit_400Regular" }]}>
                  Get personalized advice, workout plans, and more
                </Text>
                {STARTERS.map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [
                      styles.starterChip,
                      { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={[styles.starterText, { color: colors.foreground, fontFamily: "Outfit_400Regular" }]}>
                      {s}
                    </Text>
                    <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item: msg }) => (
            <View
              style={[
                styles.bubble,
                msg.role === "user"
                  ? [styles.userBubble, { backgroundColor: colors.primary }]
                  : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color: msg.role === "user" ? colors.primaryForeground : colors.foreground,
                    fontFamily: "Outfit_400Regular",
                  },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          )}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: bottomInset + tabBarH + 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.inputField,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                fontFamily: "Outfit_400Regular",
              },
            ]}
            placeholderTextColor={colors.mutedForeground}
            placeholder="Ask anything about fitness..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: input.trim() ? colors.primary : colors.muted, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            <Feather name="send" size={16} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  avatarDot: { width: 10, height: 10, borderRadius: 5 },
  headerTitle: { fontSize: 18 },
  headerSub: { fontSize: 12 },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end" },
  assistantBubble: { alignSelf: "flex-start", borderWidth: 1 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  startersContainer: { alignItems: "center", paddingVertical: 32, gap: 12 },
  coachIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  startersTitle: { fontSize: 20 },
  startersSub: { fontSize: 13, textAlign: "center" },
  starterChip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, width: "100%" },
  starterText: { fontSize: 13, flex: 1 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  inputField: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
