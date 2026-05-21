import { useRef, useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import {
  Play, Pause, Square, MapPin, Timer, TrendingUp,
  Flame, Wind, Trash2, ChevronRight, MapIcon, Trophy,
} from "lucide-react";

type RunStatus = "idle" | "active" | "paused" | "finished";

interface RoutePoint { lat: number; lng: number; ts: number }
interface RunLog {
  id: number;
  startedAt: string;
  completedAt: string;
  distanceKm: number;
  durationSeconds: number;
  avgPaceSecPerKm: number | null;
  avgSpeedKmh: number | null;
  calories: number | null;
  notes: string | null;
  routePoints: RoutePoint[] | null;
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtPace(secPerKm: number | null) {
  if (!secPerKm || secPerKm === Infinity || secPerKm > 3600) return "--:--";
  const m = Math.floor(secPerKm / 60);
  const s = Math.floor(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
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

function RouteCanvas({ points, size = 240 }: { points: RoutePoint[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext("2d")!;
    const pad = 16;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;

    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const rangeHat = maxLat - minLat || 0.001;
    const rangeLng = maxLng - minLng || 0.001;
    const scale = Math.min(w / rangeLng, h / rangeHat);

    const toX = (lng: number) => pad + (lng - minLng) * scale;
    const toY = (lat: number) => pad + h - (lat - minLat) * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, "hsl(var(--primary))");
    grad.addColorStop(1, "hsl(var(--primary) / 0.5)");

    ctx.beginPath();
    ctx.moveTo(toX(points[0].lng), toY(points[0].lat));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toX(points[i].lng), toY(points[i].lat));
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(toX(points[0].lng), toY(points[0].lat), 5, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(toX(points[points.length - 1].lng), toY(points[points.length - 1].lat), 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
  }, [points]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size * 0.6}
      className="rounded-xl w-full bg-muted/30 border border-border"
    />
  );
}

function RunHistoryCard({ run, onDelete }: { run: RunLog; onDelete: (id: number) => void }) {
  const pace = fmtPace(run.avgPaceSecPerKm);
  return (
    <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Timer className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm">{fmtDate(run.startedAt)}</p>
          <button
            onClick={() => onDelete(run.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            {run.distanceKm.toFixed(2)} km
          </span>
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3 text-primary" />
            {fmtTime(run.durationSeconds)}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            {pace} /km
          </span>
        </div>
        {run.routePoints && run.routePoints.length > 2 && (
          <div className="mt-3">
            <RouteCanvas points={run.routePoints} size={400} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Running() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [status, setStatus] = useState<RunStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [gpsAvailable, setGpsAvailable] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"run" | "history">("run");
  const [history, setHistory] = useState<RunLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const startTimeRef = useRef<number>(0);
  const pausedSecsRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null as unknown as ReturnType<typeof setInterval>);
  const watchIdRef = useRef<number>(-1);
  const lastPointRef = useRef<RoutePoint | null>(null);
  const totalDistRef = useRef(0);
  const startedAtRef = useRef<string>("");

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/run-logs", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setHistory(await res.json());
    } catch { /* silent */ }
    setLoadingHistory(false);
  }, [token]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsAvailable(false); return; }
    setGpsAvailable(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        setRoutePoints(prev => {
          const updated = [...prev, pt];
          if (lastPointRef.current) {
            const d = haversineKm(lastPointRef.current.lat, lastPointRef.current.lng, pt.lat, pt.lng);
            if (d > 0.005) {
              totalDistRef.current += d;
              setDistanceKm(totalDistRef.current);
              const dt = (pt.ts - lastPointRef.current.ts) / 1000;
              if (dt > 0) setCurrentSpeedKmh((d / dt) * 3600);
            }
          }
          lastPointRef.current = pt;
          return updated;
        });
      },
      () => setGpsAvailable(false),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== -1) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = -1;
    }
  }, []);

  const startRun = useCallback(() => {
    setStatus("active");
    setElapsed(0);
    setDistanceKm(0);
    setCurrentSpeedKmh(0);
    setRoutePoints([]);
    totalDistRef.current = 0;
    lastPointRef.current = null;
    pausedSecsRef.current = 0;
    startTimeRef.current = Date.now();
    startedAtRef.current = new Date().toISOString();

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000) - pausedSecsRef.current);
    }, 500);

    startGPS();
  }, [startGPS]);

  const pauseRun = useCallback(() => {
    setStatus("paused");
    clearInterval(intervalRef.current);
    stopGPS();
  }, [stopGPS]);

  const resumeRun = useCallback(() => {
    setStatus("active");
    const pauseStart = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    startTimeRef.current = pauseStart - elapsed * 1000;
    startGPS();
  }, [elapsed, startGPS]);

  const stopRun = useCallback(async () => {
    clearInterval(intervalRef.current);
    stopGPS();
    setStatus("finished");
    setCurrentSpeedKmh(0);

    if (!token || elapsed < 1) return;

    const avgPace = distanceKm > 0 ? elapsed / distanceKm : null;
    const avgSpeed = elapsed > 0 ? (distanceKm / elapsed) * 3600 : null;
    const calories = distanceKm > 0 ? Math.round(distanceKm * 65) : null;

    try {
      const res = await fetch("/api/run-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      if (res.ok) {
        toast({ title: "Run saved!", description: `${distanceKm.toFixed(2)} km in ${fmtTime(elapsed)}` });
        fetchHistory();
      }
    } catch { toast({ title: "Failed to save run", variant: "destructive" }); }
  }, [token, elapsed, distanceKm, routePoints, stopGPS, toast, fetchHistory]);

  const discardRun = () => {
    clearInterval(intervalRef.current);
    stopGPS();
    setStatus("idle");
    setElapsed(0);
    setDistanceKm(0);
    setCurrentSpeedKmh(0);
    setRoutePoints([]);
    totalDistRef.current = 0;
  };

  const deleteRun = useCallback(async (id: number) => {
    if (!token) return;
    await fetch(`/api/run-logs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setHistory(h => h.filter(r => r.id !== id));
    toast({ title: "Run deleted" });
  }, [token, toast]);

  useEffect(() => () => { clearInterval(intervalRef.current); stopGPS(); }, [stopGPS]);

  const avgPace = distanceKm > 0.01 ? elapsed / distanceKm : null;
  const calories = Math.round(distanceKm * 65);

  const totalDistHistory = history.reduce((s, r) => s + r.distanceKm, 0);
  const totalRunsHistory = history.length;
  const bestPace = history.reduce<number | null>((best, r) => {
    if (!r.avgPaceSecPerKm) return best;
    return best === null ? r.avgPaceSecPerKm : Math.min(best, r.avgPaceSecPerKm);
  }, null);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Running</h1>
            <p className="text-muted-foreground text-sm md:text-base">Track your runs with GPS and live stats</p>
          </div>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["run", "history"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === "history") fetchHistory(); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "history" ? `History (${totalRunsHistory})` : "Run"}
              </button>
            ))}
          </div>
        </div>

        {tab === "run" && (
          <div className="space-y-4">
            {/* Stats Summary */}
            {totalRunsHistory > 0 && status === "idle" && (
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{totalDistHistory.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Total km</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{totalRunsHistory}</p>
                    <p className="text-xs text-muted-foreground">Total runs</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{fmtPace(bestPace)}</p>
                    <p className="text-xs text-muted-foreground">Best pace /km</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Run Card */}
            <Card className={`border-2 transition-all ${status === "active" ? "border-primary shadow-lg shadow-primary/20" : status === "paused" ? "border-amber-500/50" : status === "finished" ? "border-green-500/50" : "border-border"}`}>
              <CardContent className="p-6 md:p-8 space-y-8">
                {/* Timer */}
                <div className="text-center">
                  <div className={`font-mono text-6xl md:text-8xl font-bold tracking-tight transition-colors ${status === "active" ? "text-primary" : status === "paused" ? "text-amber-400" : status === "finished" ? "text-green-400" : "text-muted-foreground"}`}>
                    {fmtTime(elapsed)}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {status === "idle" && <p className="text-muted-foreground text-sm">Ready to run</p>}
                    {status === "active" && (
                      <Badge className="bg-primary/10 text-primary border border-primary/20 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 inline-block" />
                        Live tracking
                      </Badge>
                    )}
                    {status === "paused" && <Badge variant="outline" className="text-amber-400 border-amber-400/40">Paused</Badge>}
                    {status === "finished" && <Badge className="bg-green-500/10 text-green-400 border border-green-500/30">Completed</Badge>}
                  </div>
                </div>

                {/* Live Stats Grid */}
                {(status !== "idle") && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Distance", value: `${distanceKm.toFixed(2)} km`, icon: MapPin, color: "primary" },
                      { label: "Avg pace", value: `${fmtPace(avgPace)} /km`, icon: TrendingUp, color: "primary" },
                      { label: "Speed", value: `${currentSpeedKmh.toFixed(1)} km/h`, icon: Wind, color: "primary" },
                      { label: "Calories", value: `${calories} kcal`, icon: Flame, color: "primary" },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-muted/30 rounded-xl p-3 text-center border border-border">
                        <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* GPS Status */}
                {status !== "idle" && gpsAvailable !== null && (
                  <div className={`flex items-center justify-center gap-2 text-xs ${gpsAvailable ? "text-green-400" : "text-amber-400"}`}>
                    <MapIcon className="w-3.5 h-3.5" />
                    {gpsAvailable ? "GPS active — route being tracked" : "GPS unavailable — timer only"}
                  </div>
                )}

                {/* Route Preview */}
                {status !== "idle" && routePoints.length > 2 && (
                  <RouteCanvas points={routePoints} size={600} />
                )}

                {/* Finish Summary */}
                {status === "finished" && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5 space-y-3 text-center">
                    <Trophy className="w-8 h-8 text-green-400 mx-auto" />
                    <p className="font-bold text-lg text-green-400">Run Complete!</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="font-semibold">{distanceKm.toFixed(2)} km</p><p className="text-muted-foreground text-xs">distance</p></div>
                      <div><p className="font-semibold">{fmtTime(elapsed)}</p><p className="text-muted-foreground text-xs">duration</p></div>
                      <div><p className="font-semibold">{fmtPace(avgPace)} /km</p><p className="text-muted-foreground text-xs">avg pace</p></div>
                      <div><p className="font-semibold">{calories} kcal</p><p className="text-muted-foreground text-xs">calories</p></div>
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  {status === "idle" && (
                    <Button size="lg" onClick={startRun} className="px-10 text-base font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 gap-2">
                      <Play className="w-5 h-5" /> Start Run
                    </Button>
                  )}
                  {status === "active" && (
                    <>
                      <Button size="lg" variant="outline" onClick={pauseRun} className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                        <Pause className="w-5 h-5" /> Pause
                      </Button>
                      <Button size="lg" variant="outline" onClick={stopRun} className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10">
                        <Square className="w-5 h-5" /> Stop
                      </Button>
                    </>
                  )}
                  {status === "paused" && (
                    <>
                      <Button size="lg" onClick={resumeRun} className="gap-2">
                        <Play className="w-5 h-5" /> Resume
                      </Button>
                      <Button size="lg" variant="outline" onClick={stopRun} className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10">
                        <Square className="w-5 h-5" /> Stop & Save
                      </Button>
                    </>
                  )}
                  {status === "finished" && (
                    <Button size="lg" onClick={discardRun} variant="outline" className="gap-2">
                      <Play className="w-5 h-5" /> Start New Run
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            {loadingHistory ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
              ))
            ) : history.length === 0 ? (
              <Card className="bg-card/50 border-border">
                <CardContent className="p-12 text-center">
                  <Timer className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-semibold mb-1">No runs yet</p>
                  <p className="text-muted-foreground text-sm">Switch to the Run tab and start your first run!</p>
                  <Button className="mt-4 gap-2" onClick={() => setTab("run")}>
                    <Play className="w-4 h-4" /> Start Running <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map(run => (
                  <RunHistoryCard key={run.id} run={run} onDelete={deleteRun} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
