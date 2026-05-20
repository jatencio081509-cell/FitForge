import { AppLayout } from "@/components/layout";
import { useState } from "react";
import { useCreateWorkoutLog } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Activity, Dumbbell, Clock } from "lucide-react";

export default function LogWorkout() {
  const { toast } = useToast();
  const createLog = useCreateWorkoutLog();

  const [formData, setFormData] = useState({
    workoutName: "",
    durationMinutes: 60,
    completedAt: new Date().toISOString().slice(0, 16)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLog.mutate({
      data: {
        workoutName: formData.workoutName,
        durationMinutes: Number(formData.durationMinutes),
        completedAt: new Date(formData.completedAt).toISOString()
      }
    }, {
      onSuccess: () => {
        toast({ title: "Workout logged successfully", description: "Keep up the great work!" });
        setFormData({ ...formData, workoutName: "" });
      }
    });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Log Session</h1>
          <p className="text-muted-foreground text-lg">Record your freestyle workouts.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg">Session Name</Label>
                <div className="relative">
                  <Activity className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                  <Input 
                    required 
                    value={formData.workoutName} 
                    onChange={e => setFormData({...formData, workoutName: e.target.value})}
                    placeholder="e.g. Heavy Legs, Morning Cardio..." 
                    className="pl-12 h-14 text-lg bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-lg">Duration (minutes)</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                    <Input 
                      type="number" 
                      required 
                      min="1"
                      value={formData.durationMinutes} 
                      onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                      className="pl-12 h-14 text-lg bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    required 
                    value={formData.completedAt} 
                    onChange={e => setFormData({...formData, completedAt: e.target.value})}
                    className="h-14 text-lg bg-background"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20" disabled={createLog.isPending}>
              <Dumbbell className="w-5 h-5 mr-2" />
              {createLog.isPending ? "Logging..." : "Log Workout"}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}