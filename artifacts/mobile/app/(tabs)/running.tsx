import { useRef, useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform,
  Dimensions, ActivityIndicator,
} from "react-native";
import RouteMap from "@/components/RouteMap";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const { width: SCREEN_W } = Dimensions.get("window");

type RunStatus = "idle" | "active" | "paused" | "finished";
interface RoutePoint { lat: number; lng: number; ts: number }
interface RunLog {
  id: number; startedAt: string; completedAt: string;
  distanceKm: number; durationSeconds: number; avgPaceSecPerKm: number | null;
  calories: number | null;
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtPace(secPerKm: number | null) {
  if (!secPerKm || secPerKm > 3600) return "--:--";
  return `${Math.floor(secPerKm / 60)}:${String(Math.floor(secPerKm % 60)).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RunningTab() {
  const colors = useColors();
  const { getToken, isSignedIn } = useAuth();

  const [status, setStatus] = useState<RunStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [history, setHistory] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"run" | "history">("run");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<ReturnType<typeof navigator.geolocation.watchPosition> | null>(null);
  const totalDistRef = useRef(0);
  const lastPtRef = useRef<RoutePoint | null>(null);
  const startedAtRef = useRef("");

  useEffect(() => {
    if (isSignedIn) setAuthTokenGetter(() => getToken());
  }, [isSignedIn, getToken]);

  const authHeader = useCallback(async () => {
    const t = await getToken();
    return { Authorization: `Bearer ${t ?? ""}`, "Content-Type": "application/json" };
  }, [getToken]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeader();
      const res = await fetch("/api/run-logs", { headers });
      if (res.ok) setHistory(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [authHeader]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const startGPS = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        setRoutePoints(prev => {
          if (lastPtRef.current) {
            const d = haversineKm(lastPtRef.current.lat, lastPtRef.current.lng, pt.lat, pt.lng);
            if (d > 0.005) { totalDistRef.current += d; setDistanceKm(totalDistRef.current); }
          }
          lastPtRef.current = pt;
          return [...prev, pt];
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current as number);
      watchRef.current = null;
    }
  }, []);

  const startRun = useCallback(() => {
    setStatus("active");
    setElapsed(0);
    setDistanceKm(0);
    setRoutePoints([]);
    totalDistRef.current = 0;
    lastPtRef.current = null;
    startedAtRef.current = new Date().toISOString();
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    startGPS();
  }, [startGPS]);

  const pauseRun = useCallback(() => {
    setStatus("paused");
    clearInterval(intervalRef.current!);
    stopGPS();
  }, [stopGPS]);

  const resumeRun = useCallback(() => {
    setStatus("active");
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    startGPS();
  }, [startGPS]);

  const stopRun = useCallback(async () => {
    clearInterval(intervalRef.current!);
    stopGPS();
    setStatus("finished");
    if (elapsed < 1) return;
    const avgPace = distanceKm > 0 ? elapsed / distanceKm : null;
    const avgSpeed = elapsed > 0 ? (distanceKm / elapsed) * 3600 : null;
    const calories = Math.round(distanceKm * 65);
    try {
      const headers = await authHeader();
      await fetch("/api/run-logs", {
        method: "POST",
        headers,
        body: JSON.stringify({
          distanceKm, durationSeconds: elapsed,
          avgPaceSecPerKm: avgPace ? Math.round(avgPace) : null,
          avgSpeedKmh: avgSpeed ? Math.round(avgSpeed * 10) / 10 : null,
          calories,
          routePoints: routePoints.length > 2 ? routePoints : null,
          startedAt: startedAtRef.current,
          completedAt: new Date().toISOString(),
        }),
      });
      fetchHistory();
    } catch { /* silent */ }
  }, [elapsed, distanceKm, routePoints, stopGPS, authHeader, fetchHistory]);

  const discardRun = () => {
    clearInterval(intervalRef.current!);
    stopGPS();
    setStatus("idle");
    setElapsed(0);
    setDistanceKm(0);
    setRoutePoints([]);
    totalDistRef.current = 0;
  };

  const deleteRun = async (id: number) => {
    const headers = await authHeader();
    await fetch(`/api/run-logs/${id}`, { method: "DELETE", headers });
    setHistory(h => h.filter(r => r.id !== id));
  };

  useEffect(() => () => { clearInterval(intervalRef.current!); stopGPS(); }, [stopGPS]);

  const avgPace = distanceKm > 0.01 ? elapsed / distanceKm : null;
  const calories = Math.round(distanceKm * 65);

  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: 28, fontFamily: "Outfit_700Bold", color: colors.foreground },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Outfit_400Regular", marginTop: 2 },
    tabs: { flexDirection: "row", marginHorizontal: 20, marginVertical: 12, backgroundColor: colors.muted, borderRadius: 12, padding: 4 },
    tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
    tabBtnActive: { backgroundColor: colors.card },
    tabText: { fontFamily: "Outfit_500Medium", fontSize: 13, color: colors.mutedForeground },
    tabTextActive: { color: colors.foreground },
    card: { margin: 16, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    cardActive: { borderColor: colors.primary },
    mapContainer: { height: 220, marginHorizontal: 16, marginBottom: 8, borderRadius: 16, overflow: "hidden", borderWidth: 1.5, borderColor: colors.border },
    timerLabel: { textAlign: "center", fontSize: 72, fontFamily: "Outfit_700Bold", color: colors.primary, paddingTop: 32 },
    timerIdle: { color: colors.mutedForeground },
    timerPaused: { color: "#F59E0B" },
    timerDone: { color: "#22C55E" },
    statusBadge: { alignSelf: "center", marginTop: 8, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 99, backgroundColor: `${colors.primary}20`, borderWidth: 1, borderColor: `${colors.primary}40` },
    statusText: { color: colors.primary, fontFamily: "Outfit_600SemiBold", fontSize: 12 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
    statBox: { flex: 1, minWidth: (SCREEN_W - 72) / 2, backgroundColor: colors.muted, borderRadius: 14, padding: 12, alignItems: "center" },
    statValue: { fontSize: 20, fontFamily: "Outfit_700Bold", color: colors.foreground, marginTop: 4 },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Outfit_400Regular", marginTop: 2 },
    controls: { flexDirection: "row", justifyContent: "center", gap: 12, padding: 16 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    btnPrimary: { backgroundColor: colors.primary },
    btnOutline: { borderWidth: 1.5, borderColor: colors.border },
    btnDanger: { borderWidth: 1.5, borderColor: "#EF444470" },
    btnText: { fontFamily: "Outfit_600SemiBold", fontSize: 15, color: colors.primaryForeground },
    btnTextOutline: { color: colors.foreground },
    btnTextDanger: { color: "#EF4444" },
    summaryBox: { margin: 16, backgroundColor: "#22C55E15", borderWidth: 1, borderColor: "#22C55E30", borderRadius: 16, padding: 16 },
    summaryTitle: { color: "#22C55E", fontFamily: "Outfit_700Bold", fontSize: 18, textAlign: "center", marginBottom: 12 },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    summaryItem: { flex: 1, minWidth: (SCREEN_W - 80) / 2, alignItems: "center" },
    summaryValue: { fontFamily: "Outfit_700Bold", fontSize: 18, color: colors.foreground },
    summaryKey: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Outfit_400Regular" },
    historyItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
    histIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.primary}20`, alignItems: "center", justifyContent: "center" },
    histDate: { fontFamily: "Outfit_600SemiBold", fontSize: 13, color: colors.foreground },
    histStats: { flexDirection: "row", gap: 12, marginTop: 4 },
    histStat: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Outfit_400Regular" },
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
    emptyText: { fontFamily: "Outfit_600SemiBold", fontSize: 17, color: colors.foreground, marginTop: 16 },
    emptySubtext: { fontFamily: "Outfit_400Regular", fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  });

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>Running</Text>
          <Text style={s.subtitle}>Track your pace and distance</Text>
        </View>

        <View style={s.tabs}>
          {(["run", "history"] as const).map(t => (
            <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]} onPress={() => { setTab(t); if (t === "history") fetchHistory(); }}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === "history" ? `History (${history.length})` : "Run"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {tab === "run" && (
            <View style={[s.card, status === "active" && s.cardActive]}>
              <Text style={[s.timerLabel, status === "paused" && s.timerPaused, status === "finished" && s.timerDone, status === "idle" && s.timerIdle]}>
                {fmtTime(elapsed)}
              </Text>

              <View style={s.statusBadge}>
                <Text style={s.statusText}>
                  {status === "idle" ? "Ready to run" : status === "active" ? "● Live tracking" : status === "paused" ? "Paused" : "Completed"}
                </Text>
              </View>

              {/* Live route map */}
              {status !== "idle" && (
                <View style={[s.mapContainer, status === "active" && { borderColor: colors.primary + "80" }]}>
                  <RouteMap routePoints={routePoints} status={status} style={StyleSheet.absoluteFillObject} />
                </View>
              )}

              {status !== "idle" && (
                <View style={s.statsGrid}>
                  {[
                    { label: "Distance", value: `${distanceKm.toFixed(2)} km` },
                    { label: "Avg Pace", value: `${fmtPace(avgPace)} /km` },
                    { label: "Calories", value: `${calories} kcal` },
                    { label: "GPS", value: routePoints.length > 0 ? "Active" : "Searching..." },
                  ].map(({ label, value }) => (
                    <View key={label} style={s.statBox}>
                      <Text style={s.statValue}>{value}</Text>
                      <Text style={s.statLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {status === "finished" && (
                <View style={s.summaryBox}>
                  <Text style={s.summaryTitle}>Run Complete!</Text>
                  <View style={s.summaryGrid}>
                    {[
                      { k: "Distance", v: `${distanceKm.toFixed(2)} km` },
                      { k: "Time", v: fmtTime(elapsed) },
                      { k: "Avg Pace", v: `${fmtPace(avgPace)} /km` },
                      { k: "Calories", v: `${calories} kcal` },
                    ].map(({ k, v }) => (
                      <View key={k} style={s.summaryItem}>
                        <Text style={s.summaryValue}>{v}</Text>
                        <Text style={s.summaryKey}>{k}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={s.controls}>
                {status === "idle" && (
                  <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={startRun}>
                    <Feather name="play" size={18} color={colors.primaryForeground} />
                    <Text style={s.btnText}>Start Run</Text>
                  </TouchableOpacity>
                )}
                {status === "active" && (
                  <>
                    <TouchableOpacity style={[s.btn, s.btnOutline, { borderColor: "#F59E0B60" }]} onPress={pauseRun}>
                      <Feather name="pause" size={18} color="#F59E0B" />
                      <Text style={[s.btnText, { color: "#F59E0B" }]}>Pause</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, s.btnDanger]} onPress={stopRun}>
                      <Feather name="square" size={18} color="#EF4444" />
                      <Text style={s.btnTextDanger}>Stop</Text>
                    </TouchableOpacity>
                  </>
                )}
                {status === "paused" && (
                  <>
                    <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={resumeRun}>
                      <Feather name="play" size={18} color={colors.primaryForeground} />
                      <Text style={s.btnText}>Resume</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, s.btnDanger]} onPress={stopRun}>
                      <Feather name="square" size={18} color="#EF4444" />
                      <Text style={s.btnTextDanger}>Save</Text>
                    </TouchableOpacity>
                  </>
                )}
                {status === "finished" && (
                  <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={discardRun}>
                    <Feather name="play" size={18} color={colors.primaryForeground} />
                    <Text style={s.btnText}>New Run</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {tab === "history" && (
            <View style={{ paddingHorizontal: 16 }}>
              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
              ) : history.length === 0 ? (
                <View style={s.emptyState}>
                  <Feather name="clock" size={48} color={colors.mutedForeground} />
                  <Text style={s.emptyText}>No runs yet</Text>
                  <Text style={s.emptySubtext}>Start your first run to see history</Text>
                </View>
              ) : history.map(run => (
                <View key={run.id} style={s.historyItem}>
                  <View style={s.histIcon}>
                    <Feather name="navigation" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.histDate}>{fmtDate(run.startedAt)}</Text>
                    <View style={s.histStats}>
                      <Text style={s.histStat}>{run.distanceKm.toFixed(2)} km</Text>
                      <Text style={s.histStat}>{fmtTime(run.durationSeconds)}</Text>
                      <Text style={s.histStat}>{fmtPace(run.avgPaceSecPerKm)} /km</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteRun(run.id)} style={{ padding: 4 }}>
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
