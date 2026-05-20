import { AppLayout } from "@/components/layout";
import { useGetProfile, getGetProfileQueryKey, useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    fitnessGoal: "general_fitness",
    fitnessLevel: "beginner"
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
        fitnessLevel: profile.fitnessLevel || "beginner"
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
        fitnessLevel: formData.fitnessLevel
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
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Profile & Goals</h1>
          <p className="text-muted-foreground text-lg">Tune your metrics to improve AI recommendations.</p>
        </div>

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
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="bg-background" />
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