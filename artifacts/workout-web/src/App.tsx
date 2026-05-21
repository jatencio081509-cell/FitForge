import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Workouts from "@/pages/workouts";
import WorkoutDetail from "@/pages/workout-detail";
import Exercises from "@/pages/exercises";
import LogWorkout from "@/pages/log-workout";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";
import AccountSettings from "@/pages/account-settings";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="fitforge-theme">
          <TooltipProvider>
            <Switch>
              <Route path="/" component={() => <Redirect to="/dashboard" />} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/workouts" component={Workouts} />
              <Route path="/workouts/:id" component={WorkoutDetail} />
              <Route path="/exercises" component={Exercises} />
              <Route path="/log" component={LogWorkout} />
              <Route path="/progress" component={Progress} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={AccountSettings} />
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
