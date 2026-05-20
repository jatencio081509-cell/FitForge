import { useGetProgressSummary, getGetProgressSummaryQueryKey, useListWorkoutLogs, getListWorkoutLogsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Flame, Dumbbell, Timer, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetProgressSummary({ query: { queryKey: getGetProgressSummaryQueryKey() } });
  const { data: logs, isLoading: loadingLogs } = useListWorkoutLogs({ limit: 5 }, { query: { queryKey: getListWorkoutLogsQueryKey({ limit: 5 }) } });

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome Back.</h1>
          <p className="text-muted-foreground text-lg">Ready to forge your next personal record?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
              <Flame className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.currentStreak || 0} Days</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Workouts This Week</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.workoutsThisWeek || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalVolume?.toLocaleString() || 0} kg</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
              <Timer className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalMinutes || 0} min</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Recent Activity</h2>
            <div className="space-y-4">
              {loadingLogs ? (
                <div className="h-24 bg-card rounded-lg animate-pulse" />
              ) : logs?.length ? (
                logs.map(log => (
                  <Card key={log.id} className="bg-card/50 backdrop-blur">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{log.workoutName}</h3>
                        <p className="text-sm text-muted-foreground">{new Date(log.completedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{log.durationMinutes} min</p>
                        <p className="text-sm text-muted-foreground">{log.totalVolume?.toLocaleString()} kg</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No workouts logged yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Quick Actions</h2>
            <div className="space-y-4 flex flex-col">
              <Link href="/workouts" className="flex items-center justify-between p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
                Start a Workout
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/log" className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium">
                Log Freestyle Session
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/ai-coach" className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors font-medium">
                Ask AI Coach
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
