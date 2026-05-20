import React from "react";
import { Link } from "wouter";
import { Activity, Dumbbell, CalendarRange, LineChart, Bot, User, LayoutDashboard } from "lucide-react";

export function Sidebar() {
  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/workouts", label: "Workouts", icon: CalendarRange },
    { href: "/exercises", label: "Exercises", icon: Dumbbell },
    { href: "/log", label: "Log Workout", icon: Activity },
    { href: "/progress", label: "Progress", icon: LineChart },
    { href: "/ai-coach", label: "AI Coach", icon: Bot },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="w-64 h-full bg-card border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">FitForge</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground font-medium">
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
