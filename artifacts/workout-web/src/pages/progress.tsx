import { AppLayout } from "@/components/layout";
import { useGetWeeklyProgress, getGetWeeklyProgressQueryKey, useGetPersonalRecords, getGetPersonalRecordsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp } from "lucide-react";

export default function Progress() {
  const { data: weekly, isLoading: loadingWeekly } = useGetWeeklyProgress({ query: { queryKey: getGetWeeklyProgressQueryKey() } });
  const { data: records, isLoading: loadingRecords } = useGetPersonalRecords({ query: { queryKey: getGetPersonalRecordsQueryKey() } });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-muted-foreground text-lg">Your gains, visualized.</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Volume Trends (Past 12 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                {loadingWeekly ? (
                  <div className="w-full h-full bg-accent/5 rounded animate-pulse" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly ? [...weekly].reverse() : []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                      />
                      <Bar dataKey="totalVolume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecords ? (
                <div className="h-40 bg-accent/5 rounded animate-pulse" />
              ) : records?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {records.map((pr, i) => (
                    <div key={i} className="p-4 rounded-xl bg-background border border-border flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 border border-yellow-500/20">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lg truncate">{pr.exerciseName}</p>
                        <div className="flex items-center gap-3 text-muted-foreground mt-1">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Max Wt</span>
                            <span className="font-bold text-foreground">{pr.maxWeight || 0} kg</span>
                          </div>
                          <div className="w-px h-6 bg-border" />
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70">Max Reps</span>
                            <span className="font-bold text-foreground">{pr.maxReps}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No personal records yet. Time to lift heavy!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}