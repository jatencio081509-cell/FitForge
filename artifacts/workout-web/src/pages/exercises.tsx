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
import { Search, Activity, Dumbbell, Info, Loader2, Plus, Trash2 } from "lucide-react";

const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core", "full_body"];
const MUSCLE_ICONS: Record<string, string> = {
  chest: "💪", back: "🦾", legs: "🦵", shoulders: "🏋️", arms: "💪", core: "🔥", full_body: "⚡",
};
const EQUIPMENT_OPTIONS = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "other"];

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
    } finally {
      setDeletingId(null);
    }
  };

  const queryParams = {
    ...(search ? { search } : {}),
    ...(muscle !== "all" ? { muscle } : {}),
    ...(category !== "all" ? { category } : {})
  };

  const { data: exercises, isLoading } = useListExercises(queryParams, {
    query: { queryKey: getListExercisesQueryKey(queryParams) }
  });

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExercise.mutateAsync({ data: createForm });
    queryClient.invalidateQueries({ queryKey: getListExercisesQueryKey() });
    setIsCreateOpen(false);
    setCreateForm({ name: "", muscleGroup: "chest", equipment: "bodyweight", category: "strength", description: "" });
  };

  const displayExercises = exercises;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">Exercise Library</h1>
            <p className="text-muted-foreground">Browse {exercises?.length ?? 0}+ movements across every muscle group.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Custom Exercise</DialogTitle>
              </DialogHeader>
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
          <button
            onClick={() => setMuscle("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${muscle === "all" ? "bg-primary text-black border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
          >All</button>
          {MUSCLE_GROUPS.map(mg => (
            <button key={mg} onClick={() => setMuscle(mg)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${muscle === mg ? "bg-primary text-black border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
            >
              <span>{MUSCLE_ICONS[mg]}</span>
              <span className="capitalize">{mg.replace("_", " ")}</span>
            </button>
          ))}
        </div>

        {/* Search row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search exercises..." className="pl-9 bg-card" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exercise grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />
            ))
          ) : displayExercises?.map((exercise) => (
            <Card key={exercise.id}
              className="bg-card/50 hover:bg-card/80 transition-all group border-transparent hover:border-primary/40"
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
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                      <Info className="w-3 h-3" /><span className="capitalize">{exercise.category}</span>
                    </span>
                  </div>
                  {exercise.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{exercise.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteExercise(exercise.id)}
                  disabled={deletingId === exercise.id}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  {deletingId === exercise.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </CardContent>
            </Card>
          ))}
          {displayExercises?.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No exercises found. Try a different search or create your own.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
