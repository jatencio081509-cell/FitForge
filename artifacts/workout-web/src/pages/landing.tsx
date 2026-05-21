import { Link } from "wouter";
import { Dumbbell, Zap, BarChart2, Users, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Dumbbell, title: "Smart Workouts", desc: "Structured routines with sets, reps, and rest timers." },
  { icon: Zap, title: "Live Session Tracker", desc: "Real-time timer and set checkboxes as you train." },
  { icon: BarChart2, title: "Progress Analytics", desc: "Weekly trends, personal records, and streaks." },
  { icon: Users, title: "150+ Exercises", desc: "A growing library covering every muscle group and skill level." },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/40 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg tracking-wide text-primary">FITFORGE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="bg-primary text-black hover:bg-primary/90 font-semibold">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
          <Zap className="w-3.5 h-3.5" />
          Your personal workout tracker
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Train smarter,<br />
          <span className="text-primary">not just harder.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
          FitForge gives you structured workouts, a live session tracker, progress analytics, and a 150+ exercise library — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold text-base px-8 gap-2 h-13">
              <Play className="w-4 h-4" />
              Start Training Free
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="gap-2 h-13 text-base">
              Sign in <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-border/40 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-foreground">Everything you need to reach your goals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 p-5 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center border-t border-border/40">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to forge your fitness?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of athletes tracking their progress with FitForge.</p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-primary text-black hover:bg-primary/90 font-bold px-10">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/40">
        © 2025 FitForge. All rights reserved.
      </footer>
    </div>
  );
}
