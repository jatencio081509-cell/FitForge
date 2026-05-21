import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/context/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
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
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token } = useAuth();
  if (!token) return <Redirect to="/login" />;
  return <Component />;
}

function AuthRoute() {
  const { token } = useAuth();
  if (token) return <Redirect to="/dashboard" />;
  return <Login />;
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={AuthRoute} />
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/workouts" component={() => <ProtectedRoute component={Workouts} />} />
      <Route path="/workouts/:id" component={() => <ProtectedRoute component={WorkoutDetail} />} />
      <Route path="/exercises" component={() => <ProtectedRoute component={Exercises} />} />
      <Route path="/log" component={() => <ProtectedRoute component={LogWorkout} />} />
      <Route path="/progress" component={() => <ProtectedRoute component={Progress} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={AccountSettings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="fitforge-theme">
          <TooltipProvider>
            <AuthProvider>
              <AppRoutes />
              <Toaster />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
