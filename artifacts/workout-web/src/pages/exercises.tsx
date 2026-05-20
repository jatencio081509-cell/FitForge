import { AppLayout } from "@/components/layout";
import { useListExercises, getListExercisesQueryKey, useAiSuggestExercises } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Activity, Dumbbell, Info, Cpu, Sparkles, X, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MUSCLE_GROUPS = ["chest", "back", "legs", "shoulders", "arms", "core", "full_body"];
const MUSCLE_ICONS: Record<string, string> = {
  chest: "💪", back: "🦾", legs: "🦵", shoulders: "🏋️", arms: "💪", core: "🔥", full_body: "⚡",
};

export default function Exercises() {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [aiQuery, setAiQuery] = useState("");
  const [showAiResults, setShowAiResults] = useState(false);

  const aiSuggest = useAiSuggestExercises();

  const queryParams = {
    ...(search ? { search } : {}),
    ...(muscle !== "all" ? { muscle } : {}),
    ...(category !== "all" ? { category } : {})
  };

  const { data: exercises, isLoading } = useListExercises(queryParams, {
    query: { queryKey: getListExercisesQueryKey(queryParams) }
  });

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    await aiSuggest.mutateAsync({ data: { query: aiQuery.trim(), ...(muscle !== "all" ? { muscleGroups: [muscle] } : {}) } });
    setShowAiResults(true);
  };

  const displayExercises = showAiResults && aiSuggest.data ? aiSuggest.data.exercises : exercises;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Exercise Library</h1>
          <p className="text-muted-foreground text-lg">Browse and discover movements — or let AI find them for you.</p>
        </div>

        {/* Muscle group quick-select */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setMuscle("all"); setShowAiResults(false); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${muscle === "all" && !showAiResults ? "bg-primary text-black border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
          >
            All
          </button>
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => { setMuscle(mg); setShowAiResults(false); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5 ${muscle === mg && !showAiResults ? "bg-primary text-black border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/50"}`}
            >
              <span>{MUSCLE_ICONS[mg]}</span>
              <span className="capitalize">{mg.replace("_", " ")}</span>
            </button>
          ))}
        </div>

        {/* AI Search bar */}
        <div className="p-5 bg-card/60 rounded-2xl border border-primary/20 space-y-3">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold">
            <Cpu className="w-4 h-4" />
            AI Exercise Finder
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">Beta</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Describe what you want — e.g. <em>"burn fat without equipment"</em>, <em>"exercises for big arms"</em>, <em>"compound movements for strength"</em></p>
          <div className="flex gap-2">
            <Input
              placeholder="Ask AI for exercises..."
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiSearch()}
              className="bg-background flex-1"
            />
            <Button onClick={handleAiSearch} disabled={aiSuggest.isPending || !aiQuery.trim()} className="gap-2 shrink-0">
              {aiSuggest.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiSuggest.isPending ? "Thinking..." : "Find Exercises"}
            </Button>
            {showAiResults && (
              <Button variant="ghost" size="icon" onClick={() => { setShowAiResults(false); setAiQuery(""); aiSuggest.reset(); }}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          {showAiResults && aiSuggest.data && (
            <div className="pt-1 text-sm text-muted-foreground italic border-t border-border/50">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-primary" />
              {aiSuggest.data.explanation}
            </div>
          )}
        </div>

        {/* Manual filters (hidden when showing AI results) */}
        {!showAiResults && (
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
                {MUSCLE_GROUPS.map(mg => (
                  <SelectItem key={mg} value={mg} className="capitalize">{mg.replace("_", " ")}</SelectItem>
                ))}
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
        )}

        {/* Results header */}
        {showAiResults && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              {aiSuggest.data?.exercises.length ?? 0} AI-recommended exercises
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading && !showAiResults ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
            ))
          ) : displayExercises?.map((exercise, idx) => (
            <Card
              key={exercise.id}
              className={`bg-card/50 hover:bg-card/80 transition-all cursor-pointer group border-transparent hover:border-primary/50 ${showAiResults && idx === 0 ? "ring-1 ring-primary/30" : ""}`}
            >
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 border border-border group-hover:border-primary/30 transition-colors text-2xl">
                  {MUSCLE_ICONS[exercise.muscleGroup] ?? "🏋️"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg truncate pr-4">{exercise.name}</h3>
                    <div className="flex gap-1">
                      {showAiResults && idx === 0 && (
                        <Badge className="text-xs bg-primary/20 text-primary border-primary/30 shrink-0">Top Pick</Badge>
                      )}
                      {exercise.isCustom && <Badge variant="outline" className="text-xs bg-background shrink-0">Custom</Badge>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                      <Activity className="w-3 h-3" />
                      <span className="capitalize">{exercise.muscleGroup.replace("_", " ")}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
                      <Dumbbell className="w-3 h-3" />
                      <span className="capitalize">{exercise.equipment.replace("_", " ")}</span>
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
          {displayExercises?.length === 0 && (
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
