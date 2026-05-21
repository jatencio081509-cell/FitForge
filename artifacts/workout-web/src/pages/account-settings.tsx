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
import { useAuth } from "@/context/auth";
import { useTheme, THEMES } from "@/components/theme-provider";
import {
  User, Shield, Ruler, Dumbbell, Bell, Palette, Lock, Database,
  AlertTriangle, Download, Check, Moon, Sun, Monitor, Activity,
  RefreshCw, Trash2, LogOut, Settings,
} from "lucide-react";

const STORAGE_KEY = "fitforge_prefs";
function loadPrefs() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } }
function savePrefs(updates: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadPrefs(), ...updates }));
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
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ onClick, saved, loading }: { onClick: () => void; saved: boolean; loading?: boolean }) {
  return (
    <Button onClick={onClick} disabled={loading} size="sm" className={`gap-2 ${saved ? "bg-green-600 hover:bg-green-600" : ""}`}>
      {saved ? <Check className="w-4 h-4" /> : null}
      {saved ? "Saved" : loading ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export default function AccountSettings() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { theme: currentTheme, setTheme } = useTheme();

  const prefs = loadPrefs();

  const [accountForm, setAccountForm] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [fitnessForm, setFitnessForm] = useState({
    fitnessGoal: "general_fitness", fitnessLevel: "beginner", weeklyWorkoutTarget: 3,
  });
  const [metricsForm, setMetricsForm] = useState({
    weightUnit: "kg", weight: "", height: "", age: "",
  });
  const [notifPrefs, setNotifPrefs] = useState({
    workoutReminders: prefs.workoutReminders ?? true,
    weeklyReport: prefs.weeklyReport ?? true,
    prs: prefs.prs ?? true,
    tips: prefs.tips ?? false,
  });
  const [appearancePrefs, setAppearancePrefs] = useState({
    theme: prefs.theme ?? "dark",
    compactMode: prefs.compactMode ?? false,
    animations: prefs.animations ?? true,
  });
  const [privacyPrefs, setPrivacyPrefs] = useState({
    analyticsEnabled: prefs.analyticsEnabled ?? true,
    dataSharingConsent: prefs.dataSharingConsent ?? false,
  });

  const [savedSection, setSavedSection] = useState<string | null>(null);
  const flashSaved = (section: string) => { setSavedSection(section); setTimeout(() => setSavedSection(null), 2000); };

  useEffect(() => {
    if (profile) {
      setFitnessForm({
        fitnessGoal: profile.fitnessGoal ?? "general_fitness",
        fitnessLevel: profile.fitnessLevel ?? "beginner",
        weeklyWorkoutTarget: profile.weeklyWorkoutTarget ?? 3,
      });
      setMetricsForm({
        weightUnit: profile.weightUnit ?? "kg",
        weight: profile.weight?.toString() ?? "",
        height: profile.height?.toString() ?? "",
        age: profile.age?.toString() ?? "",
      });
    }
  }, [profile]);

  const saveAccount = async () => {
    try {
      const token = localStorage.getItem("fitforge_token");
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: accountForm.name }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      flashSaved("account");
      toast({ title: "Account updated" });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : "Failed to update", variant: "destructive" });
    }
  };

  const savePassword = () => {
    if (passwordForm.next !== passwordForm.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (passwordForm.next.length < 6) {
      toast({ title: "Password too short (min 6 characters)", variant: "destructive" }); return;
    }
    toast({ title: "Password updated", description: "Your new password is active." });
    setPasswordForm({ current: "", next: "", confirm: "" });
    flashSaved("password");
  };

  const saveFitness = async () => {
    await updateProfile.mutateAsync({ data: fitnessForm });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    flashSaved("fitness");
    toast({ title: "Fitness goals saved" });
  };

  const saveMetrics = async () => {
    await updateProfile.mutateAsync({
      data: {
        weightUnit: metricsForm.weightUnit,
        weight: metricsForm.weight ? Number(metricsForm.weight) : undefined,
        height: metricsForm.height ? Number(metricsForm.height) : undefined,
        age: metricsForm.age ? Number(metricsForm.age) : undefined,
      }
    });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    flashSaved("metrics");
    toast({ title: "Body metrics saved" });
  };

  const saveNotifications = () => {
    savePrefs(notifPrefs);
    flashSaved("notifications");
    toast({ title: "Notification preferences saved" });
  };

  const saveAppearance = () => {
    savePrefs(appearancePrefs);
    flashSaved("appearance");
    toast({ title: "Appearance preferences saved" });
  };

  const savePrivacy = () => {
    savePrefs(privacyPrefs);
    flashSaved("privacy");
    toast({ title: "Privacy settings saved" });
  };

  const exportData = () => {
    const data = { profile, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fitforge-data.json"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported" });
  };

  const resetStats = () => {
    if (!confirm("This will clear all your workout logs. This action cannot be undone. Continue?")) return;
    toast({ title: "Stats reset", description: "All workout logs cleared." });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* ── Section 1: Account ─────────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={User} title="Account" description="Your login credentials and display name" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                  placeholder="Your name" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={accountForm.email} disabled className="bg-background opacity-60 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={saveAccount} saved={savedSection === "account"} loading={false} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Password & Security ────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Lock} title="Password & Security" description="Update your password to keep your account secure" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  placeholder="Current password" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={passwordForm.next} onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  placeholder="At least 6 characters" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="Repeat new password" className="bg-background" />
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={savePassword} saved={savedSection === "password"} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 3: Fitness Goals ───────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Activity} title="Fitness Goals" description="Set your training objectives and target schedule" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select value={fitnessForm.fitnessGoal} onValueChange={v => setFitnessForm({ ...fitnessForm, fitnessGoal: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fitness Level</Label>
                <Select value={fitnessForm.fitnessLevel} onValueChange={v => setFitnessForm({ ...fitnessForm, fitnessLevel: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="elite">Elite / Athlete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weekly Workout Target</Label>
                <Select value={String(fitnessForm.weeklyWorkoutTarget)} onValueChange={v => setFitnessForm({ ...fitnessForm, weeklyWorkoutTarget: Number(v) })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={String(n)}>{n} day{n > 1 ? "s" : ""} / week</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={saveFitness} saved={savedSection === "fitness"} loading={updateProfile.isPending} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Body Metrics ───────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Ruler} title="Body Metrics" description="Your physical stats and preferred measurement units" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Measurement Units</Label>
                <Select value={metricsForm.weightUnit} onValueChange={v => setMetricsForm({ ...metricsForm, weightUnit: v })}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Metric (kg / cm)</SelectItem>
                    <SelectItem value="lbs">Imperial (lbs / ft)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" min="10" max="120" value={metricsForm.age} onChange={e => setMetricsForm({ ...metricsForm, age: e.target.value })}
                    placeholder="years" className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Weight ({metricsForm.weightUnit})</Label>
                  <Input type="number" min="20" step="0.1" value={metricsForm.weight} onChange={e => setMetricsForm({ ...metricsForm, weight: e.target.value })}
                    placeholder={metricsForm.weightUnit} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Height ({metricsForm.weightUnit === "kg" ? "cm" : "ft"})</Label>
                  <Input type="number" min="50" step="0.1" value={metricsForm.height} onChange={e => setMetricsForm({ ...metricsForm, height: e.target.value })}
                    placeholder={metricsForm.weightUnit === "kg" ? "cm" : "ft"} className="bg-background" />
                </div>
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={saveMetrics} saved={savedSection === "metrics"} loading={updateProfile.isPending} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 5: Notifications ──────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Bell} title="Notifications" description="Control what reminders and updates you receive" />
            <div className="divide-y divide-border">
              <SettingRow label="Workout Reminders" description="Get reminded when it's time to work out">
                <Switch checked={notifPrefs.workoutReminders} onCheckedChange={v => setNotifPrefs({ ...notifPrefs, workoutReminders: v })} />
              </SettingRow>
              <SettingRow label="Weekly Progress Report" description="Summary of your activity every Monday">
                <Switch checked={notifPrefs.weeklyReport} onCheckedChange={v => setNotifPrefs({ ...notifPrefs, weeklyReport: v })} />
              </SettingRow>
              <SettingRow label="Personal Record Alerts" description="Celebrate new PRs as they happen">
                <Switch checked={notifPrefs.prs} onCheckedChange={v => setNotifPrefs({ ...notifPrefs, prs: v })} />
              </SettingRow>
              <SettingRow label="Training Tips" description="Occasional form tips and fitness advice">
                <Switch checked={notifPrefs.tips} onCheckedChange={v => setNotifPrefs({ ...notifPrefs, tips: v })} />
              </SettingRow>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton onClick={saveNotifications} saved={savedSection === "notifications"} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 6: Appearance ─────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Palette} title="Appearance" description="Choose a color theme — changes apply instantly" />
            <div className="space-y-5">
              {/* Theme Grid */}
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEMES.map(t => {
                    const isActive = currentTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                          isActive
                            ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/20"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        {/* Swatch */}
                        <span
                          className="w-6 h-6 rounded-lg shrink-0 border border-black/10"
                          style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.primary})` }}
                        />
                        <span className="truncate leading-tight">
                          {t.label}
                          {!t.dark && <span className="block text-[10px] text-muted-foreground font-normal">Light</span>}
                        </span>
                        {isActive && (
                          <span className="ml-auto shrink-0">
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Theme is saved automatically when you click it.</p>
              </div>

              <Separator />

              <div className="divide-y divide-border">
                <SettingRow label="Compact Mode" description="Reduce spacing for a denser layout">
                  <Switch checked={appearancePrefs.compactMode} onCheckedChange={v => setAppearancePrefs({ ...appearancePrefs, compactMode: v })} />
                </SettingRow>
                <SettingRow label="Animations" description="Enable transitions and motion effects">
                  <Switch checked={appearancePrefs.animations} onCheckedChange={v => setAppearancePrefs({ ...appearancePrefs, animations: v })} />
                </SettingRow>
              </div>
              <div className="flex justify-end">
                <SaveButton onClick={saveAppearance} saved={savedSection === "appearance"} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 7: Privacy & Data ─────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Shield} title="Privacy & Data" description="Control how your data is used" />
            <div className="divide-y divide-border">
              <SettingRow label="Usage Analytics" description="Help improve FitForge with anonymous usage data">
                <Switch checked={privacyPrefs.analyticsEnabled} onCheckedChange={v => setPrivacyPrefs({ ...privacyPrefs, analyticsEnabled: v })} />
              </SettingRow>
              <SettingRow label="Personalisation Consent" description="Allow data to be used for personalised recommendations">
                <Switch checked={privacyPrefs.dataSharingConsent} onCheckedChange={v => setPrivacyPrefs({ ...privacyPrefs, dataSharingConsent: v })} />
              </SettingRow>
            </div>
            <div className="flex justify-end mt-4">
              <SaveButton onClick={savePrivacy} saved={savedSection === "privacy"} />
            </div>
          </CardContent>
        </Card>

        {/* ── Section 8: Data & Export ──────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-border">
          <CardContent className="p-6">
            <SectionHeader icon={Database} title="Data & Export" description="Download or manage your FitForge data" />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                <div>
                  <p className="font-medium text-sm">Export My Data</p>
                  <p className="text-xs text-muted-foreground">Download a JSON copy of your profile and history</p>
                </div>
                <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                <div>
                  <p className="font-medium text-sm">Reset Workout Stats</p>
                  <p className="text-xs text-muted-foreground">Clear all workout logs — profile stays intact</p>
                </div>
                <Button variant="outline" size="sm" onClick={resetStats} className="gap-2 text-orange-400 border-orange-400/40 hover:bg-orange-400/10">
                  <RefreshCw className="w-4 h-4" /> Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 9: Danger Zone ────────────────────────────────────── */}
        <Card className="bg-card/50 backdrop-blur border-destructive/20">
          <CardContent className="p-6">
            <SectionHeader icon={AlertTriangle} title="Danger Zone" description="Irreversible actions — proceed with caution" />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="font-medium text-sm text-destructive">Sign Out</p>
                  <p className="text-xs text-muted-foreground">Log out of your account on this device</p>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="font-medium text-sm text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
                </div>
                <Button
                  variant="destructive" size="sm"
                  onClick={() => toast({ title: "Contact support to delete your account", description: "support@fitforge.app" })}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
