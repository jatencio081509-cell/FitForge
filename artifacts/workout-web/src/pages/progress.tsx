import { AppLayout } from "@/components/layout";
import {
  useGetWeeklyProgress, getGetWeeklyProgressQueryKey,
  useGetPersonalRecords, getGetPersonalRecordsQueryKey,
  useListWeightLogs, getListWeightLogsQueryKey,
  useCreateWeightLog,
  useGetProfile, getGetProfileQueryKey,
  useUpdateProfile,
  useListWorkoutLogs, getListWorkoutLogsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Dot,
} from "recharts";
import { Trophy, TrendingUp, Scale, Target, Loader2, TrendingDown, Flame } from "lucide-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ── Calendar Heatmap ────────────────────────────────────────────────────────

function CalendarHeatmap() {
  const { data: logs } = useListWorkoutLogs({ limit: 500 }, {
    query: { queryKey: getListWorkoutLogsQueryKey({ limit: 500 }) },
  });

  const { workoutDates, weeks } = useMemo(() => {
    const dateSet = new Set<string>();
    if (logs) {
      for (const log of logs) {
        const d = new Date(log.completedAt);
        dateSet.add(d.toISOString().slice(0, 10));
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build 16 weeks of days ending today
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 16 * 7 + 1);

    // Align start to Monday
    const dayOfWeek = startDate.getDay(); // 0=Sun
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + offset);

    const weeksArr: Array<Array<{ date: Date; iso: string; inRange: boolean }>> = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      const week: Array<{ date: Date; iso: string; inRange: boolean }> = [];
      for (let d = 0; d < 7; d++) {
        const iso = current.toISOString().slice(0, 10);
        week.push({ date: new Date(current), iso, inRange: current <= today });
        current.setDate(current.getDate() + 1);
      }
      weeksArr.push(week);
    }

    return { workoutDates: dateSet, weeks: weeksArr };
  }, [logs]);

  const totalWorkouts = workoutDates.size;
  const months = useMemo(() => {
    const seen = new Set<string>();
    return weeks.map(week => {
      const label = new Date(week[0].date).toLocaleDateString("en-US", { month: "short" });
      if (seen.has(label)) return null;
      seen.add(label);
      return label;
    });
  }, [weeks]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Workout Activity
          </CardTitle>
          <span className="text-sm text-muted-foreground">{totalWorkouts} session{totalWorkouts !== 1 ? "s" : ""} logged</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          {/* Month labels */}
          <div className="flex gap-1.5 mb-1 ml-7">
            {weeks.map((_, i) => (
              <div key={i} className="w-4 text-[10px] text-muted-foreground shrink-0 text-center">
                {months[i] ?? ""}
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            {/* Day labels */}
            <div className="flex flex-col gap-1.5 mr-1">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                <div key={d} className="w-5 h-4 text-[10px] text-muted-foreground/60 flex items-center justify-end pr-1">
                  {d}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1.5">
                {week.map(({ iso, inRange }) => {
                  const hasWorkout = workoutDates.has(iso);
                  return (
                    <div
                      key={iso}
                      title={hasWorkout ? `Workout on ${iso}` : iso}
                      className="w-4 h-4 rounded-sm transition-all"
                      style={{
                        backgroundColor: !inRange
                          ? "transparent"
                          : hasWorkout
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                        opacity: inRange ? 1 : 0,
                        boxShadow: hasWorkout ? "0 0 4px hsl(var(--primary) / 0.5)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-border" />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary) / 0.4)" }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary))" }} />
          <span>More</span>
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
            <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center justify-center gap-1"><Target className="w-3 h-3" /> Goal</p>
            <p className="text-xl font-bold text-primary">{goalWeight ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">{unit}</p>
          </div>
          <div className="p-3 rounded-xl bg-background border border-border text-center">
            <p className="text-[11px] text-muted-foreground mb-0.5">Change</p>
            {diff !== null ? (
              <div className="flex items-center justify-center gap-1">
                {diff < 0 ? <TrendingDown className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-yellow-500" />}
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
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                  formatter={(v: number) => [`${v} ${unit}`, "Weight"]} />
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
          <CalendarHeatmap />
          <WeightChart />

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
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }} labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }} />
                      <Bar dataKey="totalVolume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {records.map((pr, i) => (
                    <div key={i} className="p-4 rounded-xl bg-background border border-border flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate">{pr.exerciseName}</p>
                        <div className="flex items-center gap-3 text-muted-foreground mt-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Max Wt</span>
                            <span className="font-bold text-foreground">{pr.maxWeight || 0} kg</span>
                          </div>
                          <div className="w-px h-6 bg-border" />
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Max Reps</span>
                            <span className="font-bold text-foreground">{pr.maxReps}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
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
