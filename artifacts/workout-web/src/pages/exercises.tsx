import { AppLayout } from "@/components/layout";
import { useListExercises, getListExercisesQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Activity, Dumbbell, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  const queryParams = {
    ...(search ? { search } : {}),
    ...(muscle !== "all" ? { muscle } : {}),
    ...(category !== "all" ? { category } : {})
  };

  const { data: exercises, isLoading } = useListExercises(queryParams, {
    query: { queryKey: getListExercisesQueryKey(queryParams) }
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Exercise Library</h1>
          <p className="text-muted-foreground text-lg">Browse and discover movements.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-xl border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search exercises..." 
              className="pl-10 h-11 bg-background border-border"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={muscle} onValueChange={setMuscle}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Muscle Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscles</SelectItem>
              <SelectItem value="chest">Chest</SelectItem>
              <SelectItem value="back">Back</SelectItem>
              <SelectItem value="legs">Legs</SelectItem>
              <SelectItem value="shoulders">Shoulders</SelectItem>
              <SelectItem value="arms">Arms</SelectItem>
              <SelectItem value="core">Core</SelectItem>
              <SelectItem value="full_body">Full Body</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
            ))
          ) : exercises?.map(exercise => (
            <Card key={exercise.id} className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group border-transparent hover:border-primary/50">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 border border-border group-hover:border-primary/30 transition-colors">
                  <Dumbbell className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate pr-4">{exercise.name}</h3>
                    {exercise.isCustom && <Badge variant="outline" className="text-xs bg-background">Custom</Badge>}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                      <Activity className="w-3 h-3" />
                      <span className="capitalize">{exercise.muscleGroup.replace('_', ' ')}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                      <Dumbbell className="w-3 h-3" />
                      <span className="capitalize">{exercise.equipment.replace('_', ' ')}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                      <Info className="w-3 h-3" />
                      <span className="capitalize">{exercise.category}</span>
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {exercise.description || "No description available."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {exercises?.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No exercises found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}