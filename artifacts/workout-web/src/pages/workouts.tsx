import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useListWorkouts, getListWorkoutsQueryKey, useCreateWorkout, useDeleteWorkout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Dumbbell, Clock, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Workouts() {
  const { data: workouts, isLoading } = useListWorkouts({ query: { queryKey: getListWorkoutsQueryKey() } });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createWorkout = useCreateWorkout();
  const deleteWorkout = useDeleteWorkout();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficulty: "beginner",
    estimatedMinutes: 45,
    category: "strength"
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkout.mutate({ data: {
      name: formData.name,
      description: formData.description,
      difficulty: formData.difficulty,
      estimatedMinutes: Number(formData.estimatedMinutes),
      category: formData.category
    }}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
        setIsCreateOpen(false);
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteWorkout.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
      }
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Workouts</h1>
            <p className="text-muted-foreground text-lg">Manage your training plans.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                <Plus className="w-5 h-5 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Workout Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Upper Body Power" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description of the workout goals" />
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
                  <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="strength, cardio, mixed..." />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createWorkout.isPending}>
                    {createWorkout.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-xl animate-pulse" />
            ))
          ) : workouts?.map((workout) => (
            <Card key={workout.id} className="group hover:border-primary/50 transition-colors bg-card/50 backdrop-blur relative overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl pr-8">{workout.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="capitalize text-xs">{workout.difficulty}</Badge>
                  {workout.category && <Badge variant="outline" className="capitalize text-xs">{workout.category}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <div className="flex items-center gap-2 pt-2">
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