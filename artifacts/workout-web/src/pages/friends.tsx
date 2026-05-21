import { useState, useCallback, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth";
import {
  Search, UserPlus, UserCheck, UserX, Users, Trophy,
  Activity, Timer, TrendingUp, X, Dumbbell, ChevronRight, Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserResult { id: number; name: string; email: string }
interface Friend { friendshipId: number; id: number; name: string; email: string; status: string; createdAt: string }
interface FriendRequest { friendshipId: number; id: number; name: string; email: string; createdAt: string }
interface FriendProgress {
  user: { id: number; name: string; email: string };
  totalWorkouts: number;
  totalRuns: number;
  totalDistanceKm: number;
  totalVolume: number;
  recentWorkouts: { id: number; workoutName: string; completedAt: string; durationMinutes: number }[];
  recentRuns: { id: number; distanceKm: number; durationSeconds: number; startedAt: string }[];
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-xl" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0`}>
      {initials(name)}
    </div>
  );
}

function FriendProgressModal({ friendId, token, onClose }: { friendId: number; token: string; onClose: () => void }) {
  const [data, setData] = useState<FriendProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/friends/${friendId}/progress`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [friendId, token]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Friend Progress</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-3">
              <Avatar name={data.user.name || data.user.email} size="lg" />
              <div>
                <p className="font-bold text-lg">{data.user.name || "Anonymous"}</p>
                <p className="text-sm text-muted-foreground">{data.user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Workouts", value: data.totalWorkouts, icon: Dumbbell },
                { label: "Runs", value: data.totalRuns, icon: Timer },
                { label: "Km run", value: data.totalDistanceKm.toFixed(1), icon: TrendingUp },
                { label: "Volume (kg)", value: Math.round(data.totalVolume).toLocaleString(), icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-muted/30 border border-border rounded-xl p-4 text-center">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {data.recentWorkouts.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" /> Recent Workouts
                </p>
                <div className="space-y-2">
                  {data.recentWorkouts.slice(-5).reverse().map(w => (
                    <div key={w.id} className="flex items-center justify-between text-sm bg-muted/20 rounded-lg px-3 py-2">
                      <span className="font-medium truncate">{w.workoutName}</span>
                      <span className="text-muted-foreground ml-2 shrink-0">{w.durationMinutes}min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recentRuns.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" /> Recent Runs
                </p>
                <div className="space-y-2">
                  {data.recentRuns.slice(-5).reverse().map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm bg-muted/20 rounded-lg px-3 py-2">
                      <span className="font-medium">{r.distanceKm.toFixed(2)} km</span>
                      <span className="text-muted-foreground">{fmtTime(r.durationSeconds)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">Failed to load progress</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Friends() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [viewingFriendId, setViewingFriendId] = useState<number | null>(null);
  const [tab, setTab] = useState<"friends" | "add">("friends");

  const headers = { Authorization: `Bearer ${token ?? ""}` };

  const fetchFriends = useCallback(async () => {
    if (!token) return;
    const [fr, rq, sent] = await Promise.all([
      fetch("/api/friends", { headers }).then(r => r.json()),
      fetch("/api/friends/requests", { headers }).then(r => r.json()),
      fetch("/api/friends/sent", { headers }).then(r => r.json()),
    ]);
    setFriends(Array.isArray(fr) ? fr : []);
    setRequests(Array.isArray(rq) ? rq : []);
    setSentIds(new Set((Array.isArray(sent) ? sent : []).map((s: { id: number }) => s.id)));
  }, [token]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const doSearch = useCallback(async (q: string) => {
    if (!token || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { headers });
    const data = await res.json();
    setSearchResults(Array.isArray(data) ? data : []);
    setSearching(false);
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, doSearch]);

  const sendRequest = async (friendId: number) => {
    if (!token) return;
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    if (res.ok || res.status === 409) {
      setSentIds(s => new Set([...s, friendId]));
      toast({ title: "Friend request sent!" });
    } else {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  };

  const acceptRequest = async (friendshipId: number) => {
    if (!token) return;
    await fetch(`/api/friends/${friendshipId}/accept`, { method: "PUT", headers });
    toast({ title: "Friend accepted!" });
    fetchFriends();
  };

  const removeFriend = async (friendshipId: number) => {
    if (!token) return;
    await fetch(`/api/friends/${friendshipId}`, { method: "DELETE", headers });
    toast({ title: "Friend removed" });
    fetchFriends();
  };

  const isFriend = (id: number) => friends.some(f => f.id === id);
  const isPending = (id: number) => sentIds.has(id);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
            <p className="text-muted-foreground">Connect with friends and follow their progress</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
          {(["friends", "add"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "friends" ? `My Friends (${friends.length})` : "Add Friends"}
            </button>
          ))}
        </div>

        {/* Incoming Requests Banner */}
        {requests.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> {requests.length} pending request{requests.length > 1 ? "s" : ""}
              </p>
              <div className="space-y-2">
                {requests.map(r => (
                  <div key={r.friendshipId} className="flex items-center gap-3">
                    <Avatar name={r.name || r.email} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" onClick={() => acceptRequest(r.friendshipId)} className="h-7 px-3 text-xs gap-1">
                        <UserCheck className="w-3 h-3" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeFriend(r.friendshipId)} className="h-7 px-3 text-xs gap-1 text-muted-foreground">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "add" && (
          <div className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10 bg-background"
                    autoFocus
                  />
                  {searching && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />}
                </div>

                {searchQuery.length >= 2 && (
                  <div className="space-y-2">
                    {searchResults.length === 0 && !searching ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No users found for "{searchQuery}"</p>
                    ) : searchResults.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                        <Avatar name={u.name || u.email} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        {isFriend(u.id) ? (
                          <Badge variant="outline" className="text-primary border-primary/30 shrink-0">
                            <UserCheck className="w-3 h-3 mr-1" /> Friends
                          </Badge>
                        ) : isPending(u.id) ? (
                          <Badge variant="outline" className="text-muted-foreground shrink-0">Sent</Badge>
                        ) : (
                          <Button size="sm" onClick={() => sendRequest(u.id)} className="shrink-0 h-7 px-3 text-xs gap-1">
                            <UserPlus className="w-3 h-3" /> Add
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Type at least 2 characters to search</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "friends" && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <Card className="bg-card/50 border-border">
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-semibold mb-1">No friends yet</p>
                  <p className="text-muted-foreground text-sm">Search for friends and start following their progress!</p>
                  <Button className="mt-4 gap-2" onClick={() => setTab("add")}>
                    <UserPlus className="w-4 h-4" /> Find Friends <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : friends.map(f => (
              <div key={f.friendshipId} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group">
                <Avatar name={f.name || f.email} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{f.name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => setViewingFriendId(f.id)}
                  >
                    <Activity className="w-3.5 h-3.5" /> Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFriend(f.friendshipId)}
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingFriendId !== null && token && (
        <FriendProgressModal
          friendId={viewingFriendId}
          token={token}
          onClose={() => setViewingFriendId(null)}
        />
      )}
    </AppLayout>
  );
}
