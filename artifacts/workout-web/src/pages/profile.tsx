import { AppLayout } from "@/components/layout";
import {
  useGetProfile, getGetProfileQueryKey, useUpdateProfile,
  useListWeightLogs, useCreateWeightLog,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, UserCircle, Target, Scale, TrendingDown, TrendingUp, Loader2, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import { useLocation } from "wouter";

function WeightGoalPanel() {
  const { data: profile } = useGetProfile();
  const { data: weightLogs } = useListWeightLogs();
  const createWeightLog = useCreateWeightLog();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newWeight, setNewWeight] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const unit = profile?.weightUnit ?? "kg";
  const currentWeight = weightLogs?.[0]?.weight ?? profile?.weight;
  const goalWeight = profile?.weightGoal;
  const diff = currentWeight && goalWeight ? goalWeight - currentWeight : null;

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (isNaN(w)) return;
    await createWeightLog.mutateAsync({ data: { weight: w, unit } });
    await updateProfile.mutateAsync({ data: { weight: w } });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    setNewWeight("");
    toast({ title: `Weight logged: ${w}${unit}` });
  };

  const handleSetGoal = async () => {
    const g = parseFloat(newGoal);
    if (isNaN(g)) return;
    await updateProfile.mutateAsync({ data: { weightGoal: g } });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    setNewGoal("");
    toast({ title: `Weight goal set: ${g}${unit}` });
  };


  return (
    <Card className="bg-card/50 border-border overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Scale className="w-5 h-5 text-primary" />
          Weight Goal Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-2xl font-bold text-foreground">{currentWeight ? `${currentWeight}` : "—"}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Goal</p>
            <p className="text-2xl font-bold text-primary">{goalWeight ? `${goalWeight}` : "—"}</p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          <div className="p-4 rounded-xl bg-background border border-border text-center">
            <p className="text-xs text-muted-foreground mb-1">To Go</p>
            {diff !== null ? (
              <div className="flex items-center justify-center gap-1">
                {diff < 0 ? <TrendingDown className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-yellow-500" />}
                <p className="text-2xl font-bold" style={{ color: diff < 0 ? "#22c55e" : "#f59e0b" }}>
                  {Math.abs(diff).toFixed(1)}
                </p>
              </div>
            ) : <p className="text-2xl font-bold text-muted-foreground">—</p>}
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
        </div>

        {/* Log weight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Log Today's Weight ({unit})</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder={`e.g. 75.5`}
                value={newWeight}
                onChange={e => setNewWeight(e.target.value)}
                className="bg-background"
              />
              <Button onClick={handleLogWeight} disabled={createWeightLog.isPending || !newWeight} variant="outline">
                {createWeightLog.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Set Weight Goal ({unit})</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder={`e.g. 70.0`}
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                className="bg-background"
              />
              <Button onClick={handleSetGoal} disabled={updateProfile.isPending || !newGoal} variant="outline">
                {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Weight history */}
        {weightLogs && weightLogs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Recent Entries</Label>
            <div className="flex flex-wrap gap-2">
              {weightLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="px-3 py-1.5 rounded-lg bg-background border border-border text-sm">
                  <span className="font-semibold text-foreground">{log.weight}{unit}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {new Date(log.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    fitnessGoal: "general_fitness",
    fitnessLevel: "beginner",
    weeklyWorkoutTarget: "3",
    weightUnit: "kg",
  });

  const initialized = useRef(false);

  useEffect(() => {
    if (profile && !initialized.current) {
      setFormData({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        weight: profile.weight?.toString() || "",
        height: profile.height?.toString() || "",
        fitnessGoal: profile.fitnessGoal || "general_fitness",
        fitnessLevel: profile.fitnessLevel || "beginner",
        weeklyWorkoutTarget: profile.weeklyWorkoutTarget?.toString() || "3",
        weightUnit: profile.weightUnit || "kg",
      });
      initialized.current = true;
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      data: {
        name: formData.name,
        age: formData.age ? Number(formData.age) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        fitnessGoal: formData.fitnessGoal,
        fitnessLevel: formData.fitnessLevel,
        weeklyWorkoutTarget: formData.weeklyWorkoutTarget ? Number(formData.weeklyWorkoutTarget) : undefined,
        weightUnit: formData.weightUnit,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      }
    });
  };

  if (isLoading) return <AppLayout><div className="p-8 animate-pulse"><div className="h-64 bg-card rounded-xl" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Profile & Goals</h1>
            <p className="text-muted-foreground text-lg">Track your body metrics and set your fitness goals.</p>
            {user && <p className="text-sm text-primary mt-1 font-medium">{user.email}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")} className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/login"); }} className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10">
              <LogOut className="w-4 h-4" /> Log Out
            </Button>
          </div>
        </div>

        {/* Weight goal tracker */}
        <WeightGoalPanel />

        <Card className="bg-card/50 backdrop-blur border-border overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
          <CardContent className="px-8 pb-8 relative pt-16">
            <div className="absolute -top-12 left-8 w-24 h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-xl shadow-black/50">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Weight Unit</Label>
                  <div className="flex gap-2">
                    {(["kg", "lbs"] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormData({...formData, weightUnit: u})}
                        className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${formData.weightUnit === u ? "bg-primary text-black border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}
                      >{u.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Body Weight ({formData.weightUnit})</Label>
                  <Input type="number" step="0.1" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="bg-background" placeholder={formData.weightUnit === "kg" ? "e.g. 75.0" : "e.g. 165"} />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="bg-background" />
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-border">
                <h3 className="text-xl font-semibold">Fitness Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Primary Goal</Label>
                    <Select value={formData.fitnessGoal} onValueChange={v => setFormData({...formData, fitnessGoal: v})}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                        <SelectItem value="fat_loss">Fat Loss</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="general_fitness">General Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fitness Level</Label>
                    <Select value={formData.fitnessLevel} onValueChange={v => setFormData({...formData, fitnessLevel: v})}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly Workout Target</Label>
                    <Select value={formData.weeklyWorkoutTarget} onValueChange={v => setFormData({...formData, weeklyWorkoutTarget: v})}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={String(n)}>{n} day{n > 1 ? "s" : ""}/week</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={updateProfile.isPending}>
                  <Save className="w-5 h-5 mr-2" />
                  {updateProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
