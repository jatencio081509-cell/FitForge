import { AppLayout } from "@/components/layout";
import { useGetProfile, getGetProfileQueryKey, useUpdateProfile } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  User, Shield, Ruler, Dumbbell, Bell, Palette, Lock, Database,
  AlertTriangle, Download, ChevronRight, Check,
  Moon, Sun, Monitor, Smartphone, Eye,
  Activity, RefreshCw, Trash2,
} from "lucide-react";

const STORAGE_KEY = "fitforge_prefs";

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePrefs(updates: Record<string, unknown>) {
  const current = loadPrefs();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }));
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function UnitToggle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${value === opt ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"}`}
        >{opt.toUpperCase()}</button>
      ))}
    </div>
  );
}

export default function AccountSettings() {
  const { data: profile } = useGetProfile({ query: { queryKey: getGetProfileQueryKey() } });
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const prefs = loadPrefs();

  const [weightUnit, setWeightUnit] = useState<string>("kg");
  const [heightUnit, setHeightUnit] = useState<string>("cm");
  const [distanceUnit, setDistanceUnit] = useState<string>("km");

  const [restTimer, setRestTimer] = useState<string>(prefs.restTimer ?? "60");
  const [autoStartRest, setAutoStartRest] = useState<boolean>(prefs.autoStartRest ?? false);
  const [defaultSets, setDefaultSets] = useState<string>(prefs.defaultSets ?? "3");
  const [defaultReps, setDefaultReps] = useState<string>(prefs.defaultReps ?? "10");
  const [defaultDifficulty, setDefaultDifficulty] = useState<string>(prefs.defaultDifficulty ?? "intermediate");

  const [workoutReminder, setWorkoutReminder] = useState<boolean>(prefs.workoutReminder ?? false);
  const [reminderTime, setReminderTime] = useState<string>(prefs.reminderTime ?? "08:00");
  const [reminderDays, setReminderDays] = useState<string[]>(prefs.reminderDays ?? ["Mon", "Wed", "Fri"]);
  const [weeklySummary, setWeeklySummary] = useState<boolean>(prefs.weeklySummary ?? false);
  const [milestoneAlerts, setMilestoneAlerts] = useState<boolean>(prefs.milestoneAlerts ?? true);

  const [theme, setTheme] = useState<string>(prefs.theme ?? "dark");
  const [reduceMotion, setReduceMotion] = useState<boolean>(prefs.reduceMotion ?? false);
  const [compactMode, setCompactMode] = useState<boolean>(prefs.compactMode ?? false);

  const [analyticsOptOut, setAnalyticsOptOut] = useState<boolean>(prefs.analyticsOptOut ?? false);
  const [shareWorkouts, setShareWorkouts] = useState<boolean>(prefs.shareWorkouts ?? false);

  const [clearConfirm, setClearConfirm] = useState("");

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    if (profile) {
      setWeightUnit(profile.weightUnit || "kg");
    }
  }, [profile]);

  const saveUnits = async () => {
    await updateProfile.mutateAsync({ data: { weightUnit } });
    savePrefs({ heightUnit, distanceUnit });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    toast({ title: "Units saved" });
  };

  const saveWorkoutPrefs = () => {
    savePrefs({ restTimer, autoStartRest, defaultSets, defaultReps, defaultDifficulty });
    toast({ title: "Workout preferences saved" });
  };

  const saveNotifications = () => {
    savePrefs({ workoutReminder, reminderTime, reminderDays, weeklySummary, milestoneAlerts });
    toast({ title: "Notification preferences saved" });
  };

  const saveAppearance = () => {
    savePrefs({ theme, reduceMotion, compactMode });
    document.documentElement.setAttribute("data-theme", theme);
    toast({ title: "Appearance saved" });
  };

  const savePrivacy = () => {
    savePrefs({ analyticsOptOut, shareWorkouts });
    toast({ title: "Privacy settings saved" });
  };

  const exportData = async () => {
    try {
      const [profileRes, workoutsRes, exercisesRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/workout-logs"),
        fetch("/api/exercises"),
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.ok ? await profileRes.json() : null,
        workoutHistory: workoutsRes.ok ? await workoutsRes.json() : [],
        exercises: exercisesRes.ok ? await exercisesRes.json() : [],
        preferences: loadPrefs(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitforge-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported successfully" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const clearCache = () => {
    queryClient.clear();
    toast({ title: "Cache cleared" });
  };

  const handleClearAllData = () => {
    if (clearConfirm !== "CLEAR") {
      toast({ title: "Type CLEAR to confirm", variant: "destructive" });
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    queryClient.clear();
    setClearConfirm("");
    toast({ title: "Local preferences cleared" });
  };

  const toggleDay = (day: string) => {
    setReminderDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto pb-16 space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground text-lg">Manage your preferences and app behaviour.</p>
        </div>

        {/* ── 1. ACCOUNT ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={User} title="Account" description="Your FitForge identity." />
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary">
                {(profile?.name?.[0] ?? "A").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{profile?.name || "Athlete"}</p>
                <p className="text-sm text-muted-foreground">Single-user mode — no login required</p>
                <Badge variant="outline" className="text-xs gap-1 mt-1.5">
                  <Check className="w-3 h-3 text-green-500" />
                  Active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. UNITS & MEASUREMENTS ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={Ruler} title="Units & Measurements" description="Choose how you see weights, distances, and heights." />

            <SettingRow label="Weight" description="Used in workout logs and progress tracking">
              <UnitToggle value={weightUnit} onChange={setWeightUnit} options={["kg", "lbs"]} />
            </SettingRow>
            <Separator />
            <SettingRow label="Height" description="Used in your profile and BMI calculations">
              <UnitToggle value={heightUnit} onChange={setHeightUnit} options={["cm", "ft"]} />
            </SettingRow>
            <Separator />
            <SettingRow label="Distance" description="Used in cardio exercises and goals">
              <UnitToggle value={distanceUnit} onChange={setDistanceUnit} options={["km", "mi"]} />
            </SettingRow>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={saveUnits} disabled={updateProfile.isPending} className="gap-2">
                <Check className="w-4 h-4" />
                Save Units
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 3. WORKOUT PREFERENCES ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={Dumbbell} title="Workout Preferences" description="Defaults applied when you start a new session." />

            <SettingRow label="Default Rest Timer" description="Seconds between sets">
              <Select value={restTimer} onValueChange={setRestTimer}>
                <SelectTrigger className="w-28 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120, 180].map(s => (
                    <SelectItem key={s} value={String(s)}>{s}s</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <Separator />
            <SettingRow label="Auto-Start Rest Timer" description="Start the timer automatically after logging a set">
              <Switch checked={autoStartRest} onCheckedChange={setAutoStartRest} />
            </SettingRow>
            <Separator />
            <SettingRow label="Default Sets" description="Pre-filled when adding an exercise to a workout">
              <Select value={defaultSets} onValueChange={setDefaultSets}>
                <SelectTrigger className="w-20 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <Separator />
            <SettingRow label="Default Reps" description="Pre-filled reps per set">
              <Select value={defaultReps} onValueChange={setDefaultReps}>
                <SelectTrigger className="w-20 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 6, 8, 10, 12, 15, 20].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
            <Separator />
            <SettingRow label="Default Difficulty" description="Starting difficulty for new workouts">
              <Select value={defaultDifficulty} onValueChange={setDefaultDifficulty}>
                <SelectTrigger className="w-36 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={saveWorkoutPrefs} className="gap-2">
                <Check className="w-4 h-4" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 4. NOTIFICATIONS ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={Bell} title="Notifications" description="Control when FitForge reminds you to train." />

            <SettingRow label="Workout Reminders" description="Get reminded to train on your schedule">
              <Switch checked={workoutReminder} onCheckedChange={setWorkoutReminder} />
            </SettingRow>

            {workoutReminder && (
              <>
                <Separator />
                <SettingRow label="Reminder Time" description="What time to send the reminder">
                  <Input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className="w-32 bg-background" />
                </SettingRow>
                <Separator />
                <div className="py-2">
                  <p className="text-sm font-medium mb-2">Reminder Days</p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-colors border ${reminderDays.includes(day) ? "bg-primary text-black border-primary" : "bg-background border-border text-muted-foreground"}`}
                      >{day.slice(0, 2)}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />
            <SettingRow label="Weekly Summary" description="Review your weekly activity every Sunday">
              <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} />
            </SettingRow>
            <Separator />
            <SettingRow label="Milestone Alerts" description="Celebrate PRs, streaks, and achievements">
              <Switch checked={milestoneAlerts} onCheckedChange={setMilestoneAlerts} />
            </SettingRow>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={saveNotifications} className="gap-2">
                <Check className="w-4 h-4" />
                Save Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 5. APPEARANCE ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={Palette} title="Appearance" description="Customize how FitForge looks and feels." />

            <div>
              <p className="text-sm font-medium mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "light", label: "Light", icon: Sun },
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === value ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{label}</span>
                    {theme === value && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            <Separator />
            <SettingRow label="Reduce Motion" description="Minimize animations for a calmer experience">
              <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />
            </SettingRow>
            <Separator />
            <SettingRow label="Compact Mode" description="Tighter spacing to show more content at once">
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
            </SettingRow>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={saveAppearance} className="gap-2">
                <Check className="w-4 h-4" />
                Save Appearance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 6. PRIVACY ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={Lock} title="Privacy" description="Control how your data is used." />

            <SettingRow label="Opt Out of Analytics" description="Don't contribute to anonymous usage statistics">
              <Switch checked={analyticsOptOut} onCheckedChange={setAnalyticsOptOut} />
            </SettingRow>
            <Separator />
            <SettingRow label="Share Workout Data" description="Share anonymized workout data to improve the app">
              <Switch checked={shareWorkouts} onCheckedChange={setShareWorkouts} />
            </SettingRow>
            <Separator />
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Data We Store</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Your workout logs and exercise history</li>
                <li>Body weight entries and goals</li>
                <li>Profile details (name, age, height, fitness goals)</li>
                <li>App preferences stored locally on your device</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={savePrivacy} className="gap-2">
                <Check className="w-4 h-4" />
                Save Privacy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 7. DATA MANAGEMENT ── */}
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={Database} title="Data & Exports" description="Download your data or manage local storage." />

            <div className="space-y-3">
              <button
                onClick={exportData}
                className="w-full flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Export All Data</p>
                    <p className="text-xs text-muted-foreground">Download workouts, exercises, and profile as JSON</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={clearCache}
                className="w-full flex items-center justify-between p-4 bg-background rounded-xl border border-border hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Clear App Cache</p>
                    <p className="text-xs text-muted-foreground">Reload all data fresh from the server</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <Separator />

            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Storage Summary</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-card rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">Preferences</p>
                  <p className="font-bold text-foreground mt-1">{(JSON.stringify(loadPrefs()).length / 1024).toFixed(1)} KB</p>
                </div>
                <div className="text-center p-3 bg-card rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">Cached Data</p>
                  <p className="font-bold text-foreground mt-1">Synced</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 8. DANGER ZONE ── */}
        <Card className="bg-card/50 border-destructive/30">
          <CardContent className="pt-6 space-y-4">
            <SectionHeader icon={AlertTriangle} title="Danger Zone" description="Irreversible actions. Proceed with extreme caution." />

            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-destructive" />
                <p className="text-sm font-semibold text-destructive">Clear All Local Preferences</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Permanently remove all saved preferences and cached data from this device. Your workout history in the database will not be affected.
              </p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type <strong>CLEAR</strong> to confirm</Label>
                <div className="flex gap-2">
                  <Input
                    value={clearConfirm}
                    onChange={e => setClearConfirm(e.target.value)}
                    placeholder="CLEAR"
                    className="bg-background border-destructive/30 font-mono text-sm"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={clearConfirm !== "CLEAR"}
                    onClick={handleClearAllData}
                    className="shrink-0"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
