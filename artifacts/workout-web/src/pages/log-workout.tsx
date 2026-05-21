import { AppLayout } from "@/components/layout";
import { useState } from "react";
import { useCreateWorkoutLog, useListExercises } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Activity, Clock, Plus, Trash2, ChevronDown, Dumbbell, Star, X } from "lucide-react";
import { useLocation } from "wouter";

interface SetEntry {
  reps: number;
  weight: number | "";
}

interface ExerciseEntry {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: SetEntry[];
}

const STAR_RATINGS = [1, 2, 3, 4, 5];

export default function LogWorkout() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const createLog = useCreateWorkoutLog();

  const [workoutName, setWorkoutName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  const { data: allExercises } = useListExercises({});

  const filteredExercises = allExercises?.filter(e =>
    e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    e.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase())
  ) ?? [];

  const addExercise = (ex: { id: number; name: string; muscleGroup: string }) => {
    setExercises(prev => [...prev, {
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: [{ reps: 10, weight: "" }],
    }]);
    setShowExercisePicker(false);
    setExerciseSearch("");
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const addSet = (exIdx: number) => {
    setExercises(prev => prev.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, { reps: 10, weight: "" }] } : e
    ));
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setExercises(prev => prev.map((e, i) =>
      i === exIdx ? { ...e, sets: e.sets.filter((_, si) => si !== setIdx) } : e
    ));
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: number | "") => {
    setExercises(prev => prev.map((e, i) =>
      i === exIdx ? {
        ...e,
        sets: e.sets.map((s, si) => si === setIdx ? { ...s, [field]: value } : s),
      } : e
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName.trim()) { toast({ title: "Please enter a workout name", variant: "destructive" }); return; }

    const sets = exercises.flatMap((ex, _eIdx) =>
      ex.sets.map((s, sIdx) => ({
        exerciseId: ex.exerciseId,
        setNumber: sIdx + 1,
        reps: s.reps,
        weight: s.weight !== "" ? Number(s.weight) : undefined,
      }))
    );

    createLog.mutate({
      data: {
        workoutName: workoutName.trim(),
        durationMinutes: Number(durationMinutes),
        completedAt: new Date(completedAt).toISOString(),
        notes: notes.trim() || undefined,
        rating: rating ?? undefined,
        sets: sets.length > 0 ? sets : undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Workout logged!", description: "Great job. Keep it up!" });
        navigate("/progress");
      },
      onError: (err: unknown) => {
        toast({ title: "Failed to log workout", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
      }
    });
  };

  const totalVolume = exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((s, set) => s + (set.reps * (set.weight !== "" ? Number(set.weight) : 0)), 0), 0
  );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Log Session</h1>
          <p className="text-muted-foreground text-lg">Record your workout with exercises, sets, reps, and weights.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Session Info</Label>
                <div className="relative">
                  <Activity className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    required
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    placeholder="Session name (e.g. Heavy Legs, Push Day)"
                    className="pl-11 h-12 bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duration (minutes)</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number" required min="1"
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="pl-11 h-12 bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <Input
                    type="datetime-local" required
                    value={completedAt}
                    onChange={e => setCompletedAt(e.target.value)}
                    className="h-12 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Session Rating</Label>
                <div className="flex gap-2">
                  {STAR_RATINGS.map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => setRating(rating === n ? null : n)}
                      className={`transition-all ${n <= (rating ?? 0) ? "text-yellow-400 scale-110" : "text-muted-foreground/30 hover:text-yellow-400/60"}`}
                    >
                      <Star className="w-7 h-7 fill-current" />
                    </button>
                  ))}
                  {rating && <span className="text-sm text-muted-foreground self-center ml-1">{rating}/5</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Exercises</h2>
              {totalVolume > 0 && (
                <Badge variant="outline" className="border-primary/40 text-primary">
                  {totalVolume.toFixed(0)} kg total volume
                </Badge>
              )}
            </div>

            {exercises.map((ex, exIdx) => (
              <Card key={exIdx} className="bg-card/50 border-border">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{ex.exerciseName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{ex.muscleGroup.replace("_", " ")}</p>
                    </div>
                    <button type="button" onClick={() => removeExercise(exIdx)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="grid grid-cols-12 gap-2 mb-2 px-1">
                      <span className="col-span-1 text-xs text-muted-foreground text-center">#</span>
                      <span className="col-span-3 text-xs text-muted-foreground text-center">Reps</span>
                      <span className="col-span-3 text-xs text-muted-foreground text-center">kg</span>
                      <span className="col-span-3 text-xs text-muted-foreground text-center">Vol</span>
                      <span className="col-span-2" />
                    </div>
                    {ex.sets.map((set, setIdx) => {
                      const setVol = set.weight !== "" && Number(set.weight) > 0 ? set.reps * Number(set.weight) : null;
                      return (
                        <div key={setIdx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                          <div className="col-span-1 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                              {setIdx + 1}
                            </span>
                          </div>
                          <Input
                            type="number" min="1" max="999"
                            value={set.reps}
                            onChange={e => updateSet(exIdx, setIdx, "reps", Number(e.target.value))}
                            className="col-span-3 h-9 text-center bg-background text-sm"
                          />
                          <Input
                            type="number" min="0" step="0.5" placeholder="—"
                            value={set.weight}
                            onChange={e => updateSet(exIdx, setIdx, "weight", e.target.value === "" ? "" : Number(e.target.value))}
                            className="col-span-3 h-9 text-center bg-background text-sm"
                          />
                          <div className="col-span-3 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {setVol !== null ? `${setVol.toFixed(0)}` : <span className="text-muted-foreground/40">—</span>}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSet(exIdx, setIdx)}
                            disabled={ex.sets.length === 1}
                            className="col-span-2 flex items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={() => addSet(exIdx)} className="h-8 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Add Set
                    </Button>
                    {(() => {
                      const exVol = ex.sets.reduce((s, set) => s + (set.weight !== "" && Number(set.weight) > 0 ? set.reps * Number(set.weight) : 0), 0);
                      return exVol > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          Total: <span className="text-primary font-semibold">{exVol.toFixed(0)} kg</span>
                        </span>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}

            {showExercisePicker ? (
              <Card className="bg-card/50 border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Select Exercise</p>
                    <button type="button" onClick={() => setShowExercisePicker(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    autoFocus
                    placeholder="Search exercises..."
                    value={exerciseSearch}
                    onChange={e => setExerciseSearch(e.target.value)}
                    className="h-9 bg-background text-sm"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredExercises.slice(0, 20).map(ex => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => addExercise(ex)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-medium">{ex.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{ex.muscleGroup.replace("_", " ")} · {ex.equipment}</p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                    {filteredExercises.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No exercises found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-dashed"
                onClick={() => setShowExercisePicker(true)}
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Session Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="How did you feel? Any PRs? Notes on form..."
              className="bg-background resize-none h-24"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20"
            disabled={createLog.isPending}
          >
            <Activity className="w-5 h-5 mr-2" />
            {createLog.isPending ? "Saving..." : "Save Session"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
