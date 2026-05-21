import { AppLayout } from "@/components/layout";
import {
  useGetWeeklyProgress, getGetWeeklyProgressQueryKey,
  useGetPersonalRecords, getGetPersonalRecordsQueryKey,
  useListWeightLogs, getListWeightLogsQueryKey,
  useCreateWeightLog,
  useGetProfile, getGetProfileQueryKey,
  useUpdateProfile,
  useListWorkoutLogs, getListWorkoutLogsQueryKey,
  useDeleteWorkoutLog,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Dot,
} from "recharts";
import {
  Trophy, TrendingUp, Scale, Target, Loader2, TrendingDown,
  CalendarIcon, Trash2, Dumbbell, Clock, Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ── Workout Calendar ─────────────────────────────────────────────────────────

function WorkoutCalendar() {
  const { data: logs } = useListWorkoutLogs({ limit: 500 }, {
    query: { queryKey: getListWorkoutLogsQueryKey({ limit: 500 }) },
  });

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());

  const workoutDateMap = useMemo(() => {
    const m = new Map<string, typeof logs>(); // iso-date → logs on that day
    if (!logs) return m;
    for (const log of logs) {
      const iso = new Date(log.completedAt).toISOString().slice(0, 10);
      if (!m.has(iso)) m.set(iso, []);
      m.get(iso)!.push(log);
    }
    return m;
  }, [logs]);

  const workoutDays = useMemo(
    () => Array.from(workoutDateMap.keys()).map(d => new Date(d + "T12:00:00")),
    [workoutDateMap],
  );

  const totalWorkouts = workoutDateMap.size;

  const selectedIso = selectedDay?.toISOString().slice(0, 10) ?? null;
  const selectedLogs = selectedIso ? (workoutDateMap.get(selectedIso) ?? []) : [];

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Workout Calendar
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalWorkouts} session{totalWorkouts !== 1 ? "s" : ""} logged
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="shrink-0">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(d) => setSelectedDay(d?.toDateString() === selectedDay?.toDateString() ? undefined : d)}
              month={month}
              onMonthChange={setMonth}
              modifiers={{ workout: workoutDays }}
              modifiersStyles={{
                workout: {
                  fontWeight: "700",
                  color: "hsl(var(--primary))",
                  borderBottom: "3px solid hsl(var(--primary))",
                },
              }}
              classNames={{
                day: "group/day relative aspect-square h-full w-full select-none p-0 text-center",
              }}
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground px-3">
              <div className="w-2.5 h-0.5 rounded-full bg-primary" />
              <span>Workout day</span>
              <span className="ml-2 opacity-60">· Click to inspect</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {selectedDay ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                {selectedLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No workouts logged on this day
                  </div>
                ) : (
                  selectedLogs.map(log => (
                    <div key={log.id} className="rounded-xl bg-background border border-border p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {(log as { workoutName?: string }).workoutName ?? "Workout"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.completedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {(log as { durationMinutes?: number }).durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(log as { durationMinutes?: number }).durationMinutes} min
                          </span>
                        )}
                        {log.rating && (
                          <span>{"⭐".repeat(log.rating)}</span>
                        )}
                      </div>
                      {(log as { notes?: string }).notes && (
                        <p className="mt-2 text-xs text-muted-foreground italic border-t border-border pt-2">
                          {(log as { notes?: string }).notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 py-10">
                <CalendarIcon className="w-10 h-10 opacity-15" />
                <p className="text-sm text-center">
                  Click any <span className="text-primary font-semibold">highlighted date</span> to see<br />your workout details
                </p>
                {workoutDays.length > 0 && (
                  <p className="text-xs opacity-60">{workoutDays.length} active day{workoutDays.length !== 1 ? "s" : ""} this year</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Weight Chart ─────────────────────────────────────────────────────────────

function WeightChart() {
  const { data: weightLogs, isLoading } = useListWeightLogs({ query: { queryKey: getListWeightLogsQueryKey() } });
  const { data: profile } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const createWeightLog = useCreateWeightLog();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newWeight, setNewWeight] = useState("");

  const unit = profile?.weightUnit ?? "kg";
  const goalWeight = profile?.weightGoal;

  const chartData = weightLogs
    ? [...weightLogs].reverse().map(log => ({
        date: new Date(log.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: log.weight,
      }))
    : [];

  const latest = weightLogs?.[0]?.weight;
  const oldest = chartData[0]?.weight;
  const diff = latest != null && oldest != null && chartData.length > 1 ? latest - oldest : null;

  const handleLog = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w) || w <= 0) return;
    await createWeightLog.mutateAsync({ data: { weight: w, unit } });
    await updateProfile.mutateAsync({ data: { weight: w } });
    queryClient.invalidateQueries({ queryKey: getListWeightLogsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    setNewWeight("");
    toast({ title: `Weight logged: ${w} ${unit}` });
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Body Weight History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input type="number" step="0.1" placeholder={`Log weight (${unit})`} value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLog()}
              className="bg-background w-44 h-9 text-sm" />
            <Button size="sm" onClick={handleLog} disabled={createWeightLog.isPending || !newWeight} className="h-9">
              {createWeightLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
          <div className="p-3 rounded-xl bg-background border border-border text-center">
            <p className="text-[11px] text-muted-foreground mb-0.5">Current</p>
            <p className="text-xl font-bold">{latest ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{unit}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" /> Goal
            </p>
            <p className="text-xl font-bold text-primary">{goalWeight ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{unit}</p>
          </div>
          <div className="p-3 rounded-xl bg-background border border-border text-center">
            <p className="text-[11px] text-muted-foreground mb-0.5">Change</p>
            {diff !== null ? (
              <div className="flex items-center justify-center gap-1">
                {diff < 0
                  ? <TrendingDown className="w-4 h-4 text-green-500" />
                  : <TrendingUp className="w-4 h-4 text-yellow-500" />}
                <p className="text-xl font-bold" style={{ color: diff < 0 ? "#22c55e" : "#f59e0b" }}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                </p>
              </div>
            ) : <p className="text-xl font-bold text-muted-foreground">—</p>}
            <p className="text-[11px] text-muted-foreground">{unit}</p>
          </div>
        </div>
        <div className="h-[240px] w-full">
          {isLoading ? (
            <div className="w-full h-full bg-accent/5 rounded animate-pulse" />
          ) : chartData.length < 2 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Scale className="w-10 h-10 opacity-20" />
              <p className="text-sm">Log at least 2 entries to see your trend</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                  formatter={(v: number) => [`${v} ${unit}`, "Weight"]}
                />
                {goalWeight != null && (
                  <ReferenceLine y={goalWeight} stroke="hsl(var(--primary))" strokeDasharray="6 3" strokeOpacity={0.6}
                    label={{ value: `Goal: ${goalWeight}${unit}`, fill: "hsl(var(--primary))", fontSize: 11, position: "insideTopRight" }} />
                )}
                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2.5}
                  dot={<Dot r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Workout Logs (with delete) ────────────────────────────────────────────────

function WorkoutLogsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: logs, isLoading } = useListWorkoutLogs({ limit: 100 }, {
    query: { queryKey: getListWorkoutLogsQueryKey({ limit: 100 }) },
  });
  const deleteLog = useDeleteWorkoutLog();
  const [showAll, setShowAll] = useState(false);

  const displayed = useMemo(() => {
    if (!logs) return [];
    const sorted = [...logs].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    return showAll ? sorted : sorted.slice(0, 8);
  }, [logs, showAll]);

  const handleDelete = (id: number) => {
    deleteLog.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkoutLogsQueryKey({ limit: 100 }) });
        queryClient.invalidateQueries({ queryKey: getListWorkoutLogsQueryKey({ limit: 500 }) });
        toast({ title: "Workout log deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Workout Log History
          </CardTitle>
          {logs && logs.length > 0 && (
            <span className="text-sm text-muted-foreground">{logs.length} session{logs.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No workout logs yet. Start logging your sessions!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(log => {
              const date = new Date(log.completedAt);
              const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              return (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3 bg-muted/20 border border-border rounded-xl group hover:border-primary/20 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {(log as { workoutName?: string }).workoutName ?? "Workout"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{dateStr} · {timeStr}</span>
                      {(log as { durationMinutes?: number }).durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />{(log as { durationMinutes?: number }).durationMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    disabled={deleteLog.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {logs && logs.length > 8 && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl border border-dashed border-border hover:border-primary/30"
              >
                {showAll ? "Show less" : `Show all ${logs.length} sessions`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Progress() {
  const { data: weekly, isLoading: loadingWeekly } = useGetWeeklyProgress({ query: { queryKey: getGetWeeklyProgressQueryKey() } });
  const { data: records, isLoading: loadingRecords } = useGetPersonalRecords({ query: { queryKey: getGetPersonalRecordsQueryKey() } });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-muted-foreground text-lg">Your gains, visualized.</p>
        </div>

        <div className="space-y-6">
          <WorkoutCalendar />
          <WorkoutLogsSection />
          <WeightChart />

          {/* Volume Trends */}
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Volume Trends (Past 12 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                {loadingWeekly ? (
                  <div className="w-full h-full bg-accent/5 rounded animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly ? [...weekly].reverse() : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}
                        tickFormatter={val => new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                      />
                      <Bar dataKey="totalVolume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecords ? (
                <div className="h-40 bg-accent/5 rounded animate-pulse" />
              ) : records?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {records.map((pr, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{pr.exerciseName}</p>
                          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{pr.muscleGroup}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center py-2 px-1 rounded-lg bg-muted/30">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 mb-1">Max Wt</p>
                          <p className="font-bold text-foreground text-sm">{pr.maxWeight != null ? `${pr.maxWeight} kg` : "BW"}</p>
                        </div>
                        <div className="text-center py-2 px-1 rounded-lg bg-muted/30">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 mb-1">Max Reps</p>
                          <p className="font-bold text-foreground text-sm">{pr.maxReps}</p>
                        </div>
                        <div className="text-center py-2 px-1 rounded-lg bg-primary/8 border border-primary/15">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-primary/70 mb-1 flex items-center justify-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />Vol PR
                          </p>
                          <p className="font-bold text-primary text-sm">
                            {pr.bestVolume != null ? (pr.bestVolume >= 1000 ? `${(pr.bestVolume / 1000).toFixed(1)}t` : `${pr.bestVolume}kg`) : "—"}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 text-right">
                        PR set {new Date(pr.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-15" />
                  <p>No personal records yet. Time to lift heavy!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
