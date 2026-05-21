import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, Dumbbell, CalendarRange, LineChart,
  User, LayoutDashboard, Menu, X, Settings, Timer, Users,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: CalendarRange },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/log", label: "Log", icon: Activity },
  { href: "/running", label: "Running", icon: Timer },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm
        ${active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  return (
    <div className="w-60 h-full bg-card border-r border-border flex flex-col shrink-0">
      <div className="p-5 pb-4 flex items-center gap-2">
        <img src="/favicon.svg" className="w-8 h-8 rounded-lg" alt="" />
        <h1 className="text-xl font-bold tracking-tight text-primary uppercase">FitForge</h1>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
  );
}

function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card md:hidden shrink-0">
      <div className="flex items-center gap-2">
        <img src="/favicon.svg" className="w-7 h-7 rounded-md" alt="" />
        <h1 className="text-lg font-bold tracking-tight text-primary uppercase">FitForge</h1>
      </div>
      <button
        onClick={onMenuOpen}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 md:hidden"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col md:hidden">
        <div className="flex items-center justify-between p-5 pb-4">
          <h1 className="text-xl font-bold tracking-tight text-primary uppercase">FitForge</h1>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-8">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} onClick={onClose} />
          ))}
        </nav>
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop sidebar — hidden on small screens */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top header with hamburger */}
        <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
