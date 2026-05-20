import { useParams } from "wouter";
import { AppLayout } from "@/components/layout";
import { useGetWorkout, getGetWorkoutQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Play, Dumbbell, Clock, Layers, Activity } from "lucide-react";
import { Link } from "wouter";

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const workoutId = Number(id);

  const { data: workout, isLoading } = useGetWorkout(workoutId, {
    query: {
      enabled: !!workoutId,
      queryKey: getGetWorkoutQueryKey(workoutId)
    }
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-64 bg-card rounded" />
          <div className="h-32 bg-card rounded-xl" />
          <div className="space-y-4">
            <div className="h-24 bg-card rounded-lg" />
            <div className="h-24 bg-card rounded-lg" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Workout not found</h2>
          <Button asChild className="mt-4">
            <Link href="/workouts">Back to Workouts</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <Button asChild variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
          <Link href="/workouts" className="flex items-center text-muted-foreground">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Workouts
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">{workout.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize text-sm px-3 py-1">{workout.difficulty}</Badge>
              {workout.category && <Badge variant="outline" className="capitalize text-sm px-3 py-1">{workout.category}</Badge>}
              {workout.isAiGenerated && <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">AI Generated</Badge>}
            </div>
            {workout.description && (
              <p className="text-lg text-muted-foreground max-w-2xl">{workout.description}</p>
            )}
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Exercise Routine</h2>
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <Play className="w-5 h-5 mr-2" />
              Start Workout
            </Button>
          </div>

          {!workout.exercises?.length ? (
            <Card className="bg-card/50 border-dashed">
              <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium text-foreground">No exercises added yet</p>
                <p>This plan is currently empty.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {workout.exercises.map((ex, idx) => (
                <Card key={ex.id} className="bg-card/50 backdrop-blur group hover:border-primary/50 transition-colors">
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className="w-16 flex flex-col items-center justify-center bg-accent/5 rounded-l-xl border-r border-border shrink-0">
                        <span className="text-2xl font-black text-primary/40 group-hover:text-primary transition-colors">{idx + 1}</span>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div className="space-y-2 flex-1">
                          <h3 className="text-xl font-bold">{ex.exerciseName}</h3>
                          <div className="flex gap-4 text-sm font-medium text-muted-foreground">
                            {ex.muscleGroup && (
                              <div className="flex items-center gap-1">
                                <Activity className="w-4 h-4" />
                                <span className="capitalize">{ex.muscleGroup.replace('_', ' ')}</span>
                              </div>
                            )}
                            {ex.equipment && (
                              <div className="flex items-center gap-1">
                                <Dumbbell className="w-4 h-4" />
                                <span className="capitalize">{ex.equipment.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 bg-background rounded-lg p-4 border border-border">
                          <div className="text-center">
                            <div className="text-2xl font-black text-primary">{ex.sets}</div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mt-1">Sets</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-black text-primary">{ex.reps}</div>
                            <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mt-1">Reps</div>
                          </div>
                          {(ex.weight !== null && ex.weight !== undefined) && (
                            <div className="text-center">
                              <div className="text-2xl font-black text-foreground">{ex.weight}</div>
                              <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold mt-1">Kg</div>
                            </div>
                          )}
                          {(ex.restSeconds !== null && ex.restSeconds !== undefined) && (
                            <div className="text-center ml-2 pl-4 border-l border-border">
                              <div className="text-xl font-bold text-muted-foreground">{ex.restSeconds}s</div>
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Rest</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}