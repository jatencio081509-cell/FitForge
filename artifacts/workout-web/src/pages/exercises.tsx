import { AppLayout } from "@/components/layout";
import { useListExercises, getListExercisesQueryKey, useCreateExercise } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Activity, Dumbbell, Info, Loader2, Plus, Trash2, ChevronRight, X, RotateCcw } from "lucide-react";
import { MuscleFigure3D } from "@/components/muscle-figure-3d";

const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core", "full_body"];
const MUSCLE_ICONS: Record<string, string> = {
  chest: "💪", back: "🦾", legs: "🦵", shoulders: "🏋️", arms: "💪", core: "🔥", full_body: "⚡",
};
const EQUIPMENT_OPTIONS = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "other"];

type Exercise = {
  id: number;
  name: string;
  description?: string | null;
  instructions?: string | null;
  muscleGroup: string;
  equipment: string;
  category: string;
  isCustom: boolean;
  createdAt: string;
  imageUrl?: string | null;
};

function ExerciseDetailDialog({ exercise, children }: { exercise: Exercise; children: React.ReactNode }) {
  const steps = exercise.instructions?.split("\n").filter(Boolean) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl pr-4">{exercise.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">{exercise.muscleGroup.replace("_", " ")}</Badge>
            <Badge variant="outline" className="capitalize">{exercise.equipment}</Badge>
            <Badge variant="outline" className="capitalize">{exercise.category}</Badge>
            {exercise.isCustom && <Badge>Custom</Badge>}
          </div>

          {/* 3D Muscle figure */}
          <div className="flex justify-center py-2 bg-muted/20 rounded-2xl border border-border">
            <MuscleFigure3D activeMuscles={[exercise.muscleGroup]} size={200} autoRotate />
          </div>

          {/* Description */}
          {exercise.description && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">About</p>
              <p className="text-sm text-foreground leading-relaxed">{exercise.description}</p>
            </div>
          )}

          {/* Instructions */}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">How to perform</p>
              <ol className="space-y-2">
                {steps.map((step, i) => {
                  const text = step.replace(/^\d+\.\s*/, "");
                  return (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{text}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {!exercise.description && steps.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No detailed instructions available for this exercise yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 3D Muscle Figure Side Panel ───────────────────────────────────────────────

function MuscleSidePanel({ activeMuscle, onClose }: { activeMuscle: string; onClose?: () => void }) {
  return (
    <div className="relative w-full bg-card/50 border border-border rounded-2xl p-4 flex flex-col items-center gap-3">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors lg:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Muscles Targeted
      </p>
      <MuscleFigure3D activeMuscles={[activeMuscle]} size={240} autoRotate />
      <p className="text-sm font-medium capitalize text-primary">
        {activeMuscle.replace("_", " ")}
      </p>
      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Drag to rotate · Highlights primary muscles
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <RotateCcw className="w-3 h-3" /> Auto-rotating 3D model
      </div>
    </div>
  );
}

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [hoveredMuscle, setHoveredMuscle] = useState<string>("full_body");
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", muscleGroup: "chest", equipment: "bodyweight",
    category: "strength", description: "",
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const createExercise = useCreateExercise();

  const handleDeleteExercise = async (id: number) => {
    if (!confirm("Delete this exercise? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("fitforge_token");
      await fetch(`/api/exercises/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
    } finally {
      setDeletingId(null);
    }
  };

  const queryParams = {
    ...(search ? { search } : {}),
    ...(muscle !== "all" ? { muscle } : {}),
    ...(category !== "all" ? { category } : {}),
  };

  const { data: exercises, isLoading } = useListExercises(queryParams, {
    query: { queryKey: getListExercisesQueryKey(queryParams) },
  });

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExercise.mutateAsync({ data: createForm });
    queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
    setIsCreateOpen(false);
    setCreateForm({ name: "", muscleGroup: "chest", equipment: "bodyweight", category: "strength", description: "" });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Exercise Library</h1>
            <p className="text-muted-foreground text-sm md:text-base">Browse {exercises?.length ?? 0}+ movements across every muscle group.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0"><Plus className="w-4 h-4" />Add Exercise</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Create Custom Exercise</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateExercise} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required placeholder="e.g. Bulgarian Split Squat" value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Muscle Group</Label>
                    <Select value={createForm.muscleGroup} onValueChange={v => setCreateForm({ ...createForm, muscleGroup: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map(mg => (
                          <SelectItem key={mg} value={mg} className="capitalize">{mg.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Equipment</Label>
                    <Select value={createForm.equipment} onValueChange={v => setCreateForm({ ...createForm, equipment: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_OPTIONS.map(eq => (
                          <SelectItem key={eq} value={eq} className="capitalize">{eq}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={createForm.category} onValueChange={v => setCreateForm({ ...createForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="How to perform this exercise..." value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })} rows={3} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createExercise.isPending}>
                    {createExercise.isPending ? "Creating..." : "Create Exercise"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Muscle group quick-select */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setMuscle("all"); setHoveredMuscle("full_body"); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${muscle === "all" ? "bg-primary text-black border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
            All
          </button>
          {MUSCLE_GROUPS.map(mg => (
            <button key={mg} onClick={() => { setMuscle(mg); setHoveredMuscle(mg); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${muscle === mg ? "bg-primary text-black border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}>
              <span>{MUSCLE_ICONS[mg]}</span>
              <span className="capitalize">{mg.replace("_", " ")}</span>
            </button>
          ))}
          {/* Mobile: show 3D figure toggle */}
          <button
            onClick={() => setShowMobilePanel(v => !v)}
            className="lg:hidden ml-auto px-3 py-1.5 rounded-full text-sm font-medium border border-primary/40 text-primary bg-primary/5 flex items-center gap-1.5"
          >
            <span>🫀</span> 3D Figure
          </button>
        </div>

        {/* Mobile 3D panel */}
        {showMobilePanel && (
          <div className="lg:hidden">
            <MuscleSidePanel
              activeMuscle={hoveredMuscle}
              onClose={() => setShowMobilePanel(false)}
            />
          </div>
        )}

        {/* Two-column layout: exercise list + 3D sidebar */}
        <div className="flex gap-6 items-start">
          {/* Left: search + grid */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search exercises..." className="pl-9 bg-card" value={search}
                  onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="mobility">Mobility</SelectItem>
                  <SelectItem value="plyometrics">Plyometrics</SelectItem>
                  <SelectItem value="olympic">Olympic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />)
                : exercises?.map(exercise => (
                  <ExerciseDetailDialog key={exercise.id} exercise={exercise as Exercise}>
                    <Card
                      className="bg-card/50 hover:bg-card/80 transition-all group border-transparent hover:border-primary/40 cursor-pointer"
                      onMouseEnter={() => setHoveredMuscle(exercise.muscleGroup)}
                    >
                      <CardContent className="p-4 flex gap-3 items-center">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-border group-hover:border-primary/30 transition-colors text-xl">
                          {MUSCLE_ICONS[exercise.muscleGroup] ?? "🏋️"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-semibold truncate">{exercise.name}</h3>
                            {exercise.isCustom && <Badge variant="outline" className="text-xs shrink-0">Custom</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                              <Activity className="w-3 h-3" /><span className="capitalize">{exercise.muscleGroup.replace("_", " ")}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                              <Dumbbell className="w-3 h-3" /><span className="capitalize">{exercise.equipment}</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                              <Info className="w-3 h-3" /><span className="capitalize">{exercise.category}</span>
                            </span>
                          </div>
                          {exercise.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{exercise.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteExercise(exercise.id); }}
                            disabled={deletingId === exercise.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                            {deletingId === exercise.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </ExerciseDetailDialog>
                ))}
              {exercises?.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground">
                  <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No exercises found. Try a different search or create your own.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: sticky 3D muscle figure (desktop only) */}
          <div className="hidden lg:block w-60 xl:w-72 shrink-0">
            <div className="sticky top-6">
              <MuscleSidePanel activeMuscle={hoveredMuscle} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
