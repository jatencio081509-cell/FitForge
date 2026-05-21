import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout";
import {
  useListWorkouts, getListWorkoutsQueryKey, useCreateWorkout, useDeleteWorkout,
  useListExercises, getListExercisesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Dumbbell, Clock, Trash2, Plus, Search, X, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import { useToast } from "@/hooks/use-toast";

interface SelectedExercise {
  exerciseId: number;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
}

export default function Workouts() {
  const { data: workouts, isLoading } = useListWorkouts({ query: { queryKey: getListWorkoutsQueryKey() } });
  const { data: exercises } = useListExercises({}, { query: { queryKey: getListExercisesQueryKey() } });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [step, setStep] = useState<"info" | "exercises">("info");
  const [newWorkoutId, setNewWorkoutId] = useState<number | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [saving, setSaving] = useState(false);

  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficulty: "beginner",
    estimatedMinutes: 45,
    category: "strength"
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", difficulty: "beginner", estimatedMinutes: 45, category: "strength" });
    setSelectedExercises([]);
    setExerciseSearch("");
    setStep("info");
    setNewWorkoutId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkout.mutate({ data: {
      name: formData.name,
      description: formData.description,
      difficulty: formData.difficulty,
      estimatedMinutes: Number(formData.estimatedMinutes),
      category: formData.category
    }}, {
      onSuccess: (data) => {
        setNewWorkoutId(data.id);
        setStep("exercises");
      }
    });
  };

  const handleFinish = async () => {
    if (!newWorkoutId || !token) {
      queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
      setIsCreateOpen(false);
      resetForm();
      return;
    }

    if (selectedExercises.length > 0) {
      setSaving(true);
      try {
        await fetch(`/api/workouts/${newWorkoutId}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ exercises: selectedExercises }),
        });
        toast({ title: "Workout created!", description: `${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""} added.` });
      } catch { toast({ title: "Workout created, but exercises failed to save", variant: "destructive" }); }
      setSaving(false);
    } else {
      toast({ title: "Workout created!" });
    }

    queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    deleteWorkout.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
      }
    });
  };

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const q = exerciseSearch.toLowerCase();
    return exercises.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.muscleGroup?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [exercises, exerciseSearch]);

  const isSelected = (id: number) => selectedExercises.some(e => e.exerciseId === id);

  const toggleExercise = (ex: { id: number; name: string }) => {
    if (isSelected(ex.id)) {
      setSelectedExercises(prev => prev.filter(e => e.exerciseId !== ex.id));
    } else {
      setSelectedExercises(prev => [...prev, { exerciseId: ex.id, name: ex.name, sets: 3, reps: 10, restSeconds: 60 }]);
    }
  };

  const updateExercise = (id: number, field: "sets" | "reps" | "restSeconds", val: number) => {
    setSelectedExercises(prev => prev.map(e => e.exerciseId === id ? { ...e, [field]: val } : e));
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1 md:mb-2">Workouts</h1>
            <p className="text-muted-foreground text-sm md:text-lg">Manage your training plans.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all shrink-0">
                <Plus className="w-5 h-5 mr-1.5" />
                <span className="hidden sm:inline">New Plan</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {step === "exercises" && (
                    <button onClick={() => setStep("info")} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {step === "info" ? "Create Workout Plan" : "Add Exercises"}
                  <Badge variant="outline" className="ml-auto text-xs">{step === "info" ? "1/2" : "2/2"}</Badge>
                </DialogTitle>
              </DialogHeader>

              {step === "info" && (
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Upper Body Power" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description of the workout goals" rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select value={formData.difficulty} onValueChange={v => setFormData({...formData, difficulty: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Est. Minutes</Label>
                      <Input type="number" required min="1" value={formData.estimatedMinutes} onChange={e => setFormData({...formData, estimatedMinutes: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="hiit">HIIT</SelectItem>
                        <SelectItem value="mobility">Mobility</SelectItem>
                        <SelectItem value="powerlifting">Powerlifting</SelectItem>
                        <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createWorkout.isPending} className="gap-1.5">
                      {createWorkout.isPending ? "Creating..." : "Next"} <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}

              {step === "exercises" && (
                <div className="space-y-4 pt-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={exerciseSearch}
                      onChange={e => setExerciseSearch(e.target.value)}
                      placeholder="Search exercises by name or muscle..."
                      className="pl-10"
                      autoFocus
                    />
                    {exerciseSearch && (
                      <button onClick={() => setExerciseSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Exercise List */}
                  <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border p-2 bg-muted/20">
                    {filteredExercises.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No exercises found</p>
                    ) : filteredExercises.map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => toggleExercise(ex)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${isSelected(ex.id) ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted"}`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected(ex.id) ? "bg-primary border-primary" : "border-border"}`}>
                          {isSelected(ex.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ex.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{ex.muscleGroup} · {ex.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Selected Exercises Config */}
                  {selectedExercises.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Selected ({selectedExercises.length})</p>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {selectedExercises.map(ex => (
                          <div key={ex.exerciseId} className="bg-card border border-border rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate pr-2">{ex.name}</p>
                              <button onClick={() => toggleExercise({ id: ex.exerciseId, name: ex.name })} className="text-muted-foreground hover:text-destructive shrink-0">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Sets", field: "sets" as const, min: 1 },
                                { label: "Reps", field: "reps" as const, min: 1 },
                                { label: "Rest (s)", field: "restSeconds" as const, min: 0 },
                              ].map(({ label, field, min }) => (
                                <div key={field} className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{label}</Label>
                                  <Input
                                    type="number"
                                    min={min}
                                    value={ex[field]}
                                    onChange={e => updateExercise(ex.exerciseId, field, Number(e.target.value))}
                                    className="h-8 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <p className="text-xs text-muted-foreground">
                      {selectedExercises.length === 0 ? "You can add exercises later" : `${selectedExercises.length} exercise${selectedExercises.length !== 1 ? "s" : ""} selected`}
                    </p>
                    <Button onClick={handleFinish} disabled={saving} className="gap-1.5">
                      <Check className="w-4 h-4" />
                      {saving ? "Saving..." : "Create Plan"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />
            ))
          ) : workouts?.map((workout) => (
            <Card key={workout.id} className="group hover:border-primary/50 transition-colors bg-card/50 backdrop-blur relative overflow-hidden">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-lg md:text-xl pr-8">{workout.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="secondary" className="capitalize text-xs">{workout.difficulty}</Badge>
                  {workout.category && <Badge variant="outline" className="capitalize text-xs">{workout.category}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {workout.description || "No description provided."}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    {workout.estimatedMinutes} min
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    {workout.exerciseCount || 0} exercises
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button asChild className="flex-1">
                    <Link href={`/workouts/${workout.id}`}>View Plan</Link>
                  </Button>
                  <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(workout.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
