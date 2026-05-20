import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSignIn, useSSO } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
};

export default function SignInPage() {
  useWarmUpBrowser();
  const colors = useColors();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const handleEmailSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/" : (url as any));
        },
      });
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          router.replace(decorateUrl("/") as any);
        },
      });
    }
  };

  const handleGoogleSSO = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        setActive!({
          session: createdSessionId,
          navigate: async ({ decorateUrl }) => { router.replace(decorateUrl("/") as any); },
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Verify your device</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Enter the code sent to your email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={code} onChangeText={setCode} keyboardType="numeric"
          placeholder="6-digit code" placeholderTextColor={colors.mutedForeground}
        />
        {errors?.fields?.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
        <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={handleVerify}>
          <Text style={styles.btnText}>Verify</Text>
        </Pressable>
        <Pressable onPress={() => signIn.mfa.sendEmailCode()}>
          <Text style={[styles.link, { color: colors.primary }]}>Resend code</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header gradient */}
        <LinearGradient colors={[colors.primary + "22", "transparent"]} style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Feather name="activity" size={28} color="#000" />
          </View>
          <Text style={[styles.brand, { color: colors.primary }]}>FITFORGE</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in to continue training</Text>
        </LinearGradient>

        <View style={styles.form}>
          {/* Google SSO */}
          <Pressable
            style={({ pressed }) => [styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            onPress={handleGoogleSSO}
          >
            <Text style={{ fontSize: 18 }}>G</Text>
            <Text style={[styles.googleBtnText, { color: colors.foreground }]}>Continue with Google</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Email address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address"
            placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
          />
          {errors?.fields?.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}

          {/* Password */}
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.inputInner, { color: colors.foreground }]}
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••" placeholderTextColor={colors.mutedForeground}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {errors?.fields?.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: (!email || !password || fetchStatus === "fetching" || pressed) ? 0.7 : 1 },
            ]}
            onPress={handleEmailSignIn}
            disabled={!email || !password || fetchStatus === "fetching"}
          >
            {fetchStatus === "fetching"
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.btnText}>Sign In</Text>}
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={[styles.link, { color: colors.primary }]}>Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  hero: { paddingTop: 80, paddingBottom: 32, paddingHorizontal: 24, alignItems: "center", gap: 8 },
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  brand: { fontSize: 14, fontWeight: "700", letterSpacing: 3 },
  title: { fontSize: 26, fontWeight: "700", marginTop: 4 },
  subtitle: { fontSize: 14, marginTop: 2 },
  form: { paddingHorizontal: 24, paddingTop: 24, gap: 12, paddingBottom: 40 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  googleBtnText: { fontSize: 15, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: -4 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  inputInner: { flex: 1, paddingVertical: 14, fontSize: 15 },
  eye: { padding: 4 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnText: { color: "#000", fontSize: 16, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: "600" },
  error: { color: "#ef4444", fontSize: 12, marginTop: -4 },
  container: { flex: 1, padding: 24, gap: 16, justifyContent: "center" },
});
