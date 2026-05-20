import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout";
import { useGetWorkout, getGetWorkoutQueryKey, useCreateWorkoutLog } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Play, Dumbbell, Clock, Layers, Activity, CheckCircle2, Circle, Star, Timer, Trophy, Square } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";

type SetState = "idle" | "done";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const workoutId = Number(id);

  const { data: workout, isLoading } = useGetWorkout(workoutId, {
    query: { enabled: !!workoutId, queryKey: getGetWorkoutQueryKey(workoutId) }
  });

  const createLog = useCreateWorkoutLog();

  const [sessionActive, setSessionActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sets, setSets] = useState<Record<string, SetState>>({});
  const [showFinish, setShowFinish] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = useCallback(() => {
    if (!workout) return;
    const initial: Record<string, SetState> = {};
    workout.exercises.forEach(ex => {
      for (let i = 0; i < ex.sets; i++) initial[`${ex.id}-${i}`] = "idle";
    });
    setSets(initial);
    setElapsed(0);
    setSessionActive(true);
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  }, [workout]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const toggleSet = (key: string) => {
    setSets(prev => ({ ...prev, [key]: prev[key] === "done" ? "idle" : "done" }));
  };

  const doneSets = Object.values(sets).filter(s => s === "done").length;
  const totalSets = Object.keys(sets).length;

  const finishSession = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await createLog.mutateAsync({
      data: {
        workoutId,
        workoutName: workout!.name,
        completedAt: new Date().toISOString(),
        durationMinutes: Math.max(1, Math.round(elapsed / 60)),
        notes: notes || undefined,
        rating: rating || undefined,
      }
    });
    navigate("/workouts");
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-card rounded" />
          <div className="h-32 bg-card rounded-xl" />
          {[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-xl" />)}
        </div>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Workout not found</h2>
          <Button asChild className="mt-4"><Link href="/workouts">Back</Link></Button>
        </div>
      </AppLayout>
    );
  }

  if (showFinish) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto py-20 space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Workout Complete!</h1>
            <p className="text-muted-foreground">
              You trained for <span className="text-foreground font-semibold">{formatTime(elapsed)}</span> and hit{" "}
              <span className="text-foreground font-semibold">{doneSets}/{totalSets}</span> sets.
            </p>
          </div>
          <div className="space-y-3 text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Rate this session</p>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-left">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notes (optional)</p>
            <textarea
              className="w-full bg-card border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3} placeholder="How did it go?" value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <Button size="lg" className="w-full" onClick={finishSession} disabled={createLog.isPending}>
            {createLog.isPending ? "Saving..." : "Save & Finish"}
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (sessionActive) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          <div className="sticky top-0 z-10 bg-background/90 backdrop-blur py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Live Session</p>
              <h1 className="text-xl font-bold">{workout.name}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-2xl font-mono font-bold text-primary">
                <Timer className="w-5 h-5" />{formatTime(elapsed)}
              </div>
              <Button onClick={() => setShowFinish(true)} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />Finish
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneSets} of {totalSets} sets done</span>
              <span>{Math.round((doneSets / Math.max(totalSets, 1)) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(doneSets / Math.max(totalSets, 1)) * 100}%` }} />
            </div>
          </div>
          <div className="space-y-4">
            {workout.exercises.map((ex, exIdx) => {
              const exSets = Array.from({ length: ex.sets }, (_, i) => `${ex.id}-${i}`);
              const exDone = exSets.filter(k => sets[k] === "done").length;
              const allDone = exDone === ex.sets;
              return (
                <Card key={ex.id} className={`transition-colors ${allDone ? "border-primary/40 bg-primary/5" : "bg-card/50"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${allDone ? "bg-primary text-black" : "bg-muted text-muted-foreground"}`}>
                          {allDone ? "✓" : exIdx + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold">{ex.exerciseName}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{ex.muscleGroup?.replace("_"," ")} · {ex.equipment}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-bold text-primary">{exDone}/{ex.sets}</span>
                        <p className="text-xs text-muted-foreground">sets done</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exSets.map((key, setIdx) => {
                        const done = sets[key] === "done";
                        return (
                          <button key={key} onClick={() => toggleSet(key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${done ? "bg-primary text-black border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}>
                            {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            Set {setIdx + 1} <span className="text-xs opacity-70">× {ex.reps}</span>
                          </button>
                        );
                      })}
                    </div>
                    {ex.restSeconds != null && ex.restSeconds > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{ex.restSeconds}s rest between sets
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button size="lg" variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10" onClick={() => setShowFinish(true)}>
            <Square className="w-4 h-4 mr-2" />End Session
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <Button asChild variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary">
          <Link href="/workouts" className="flex items-center text-muted-foreground">
            <ChevronLeft className="w-5 h-5 mr-1" />Back to Workouts
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">{workout.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize text-sm px-3 py-1">{workout.difficulty}</Badge>
              {workout.category && <Badge variant="outline" className="capitalize text-sm px-3 py-1">{workout.category}</Badge>}
              {workout.isAiGenerated && <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">AI</Badge>}
            </div>
            {workout.description && <p className="text-lg text-muted-foreground max-w-2xl">{workout.description}</p>}
          </div>
          <div className="flex gap-4 p-4 bg-card rounded-xl border border-border min-w-fit">
            <div className="flex flex-col items-center px-4">
              <Clock className="w-6 h-6 text-primary mb-1" />
              <span className="font-bold text-lg">{workout.estimatedMinutes}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Mins</span>
            </div>
            <div className="w-px bg-border my-2" />
            <div className="flex flex-col items-center px-4">
              <Layers className="w-6 h-6 text-primary mb-1" />
              <span className="font-bold text-lg">{workout.exercises?.length || 0}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Exercises</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Exercise Routine</h2>
            <Button size="lg" onClick={startSession} className="shadow-lg shadow-primary/20 gap-2">
              <Play className="w-5 h-5" />Start Session
            </Button>
          </div>
          {!workout.exercises?.length ? (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground">No exercises added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workout.exercises.map((ex, idx) => (
                <Card key={ex.id} className="bg-card/50 backdrop-blur group hover:border-primary/50 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-14 flex items-center justify-center bg-accent/5 rounded-l-xl border-r border-border shrink-0">
                        <span className="text-xl font-black text-primary/40 group-hover:text-primary transition-colors">{idx + 1}</span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold">{ex.exerciseName}</h3>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            {ex.muscleGroup && <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /><span className="capitalize">{ex.muscleGroup.replace('_',' ')}</span></span>}
                            {ex.equipment && <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /><span className="capitalize">{ex.equipment}</span></span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-background rounded-lg px-4 py-3 border border-border">
                          <div className="text-center"><div className="text-2xl font-black text-primary">{ex.sets}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Sets</div></div>
                          <div className="text-center"><div className="text-2xl font-black text-primary">{ex.reps}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Reps</div></div>
                          {ex.restSeconds != null && <div className="text-center ml-2 pl-4 border-l border-border"><div className="text-xl font-bold text-muted-foreground">{ex.restSeconds}s</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rest</div></div>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        {(workout.exercises?.length ?? 0) > 0 && (
          <Button size="lg" onClick={startSession} className="w-full shadow-lg shadow-primary/20 gap-2 h-14 text-base">
            <Play className="w-5 h-5" />Start Session
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
