import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#00E6D2",
    colorForeground: "#f8fafc",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#0f172a",
    colorInput: "#1e293b",
    colorInputForeground: "#f8fafc",
    colorNeutral: "#334155",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f172a] border border-[#1e293b] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-[#00E6D2] hover:text-[#00cfbb]",
    footerActionText: "text-slate-400",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-[#00E6D2]",
    formFieldSuccessText: "text-[#00E6D2]",
    alertText: "text-white",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10",
    socialButtonsBlockButton: "border-[#334155] bg-[#1e293b] hover:bg-[#263548]",
    formButtonPrimary: "bg-[#00E6D2] hover:bg-[#00cfbb] text-black font-semibold",
    formFieldInput: "bg-[#1e293b] border-[#334155] text-white",
    footerAction: "border-t border-[#1e293b]",
    dividerLine: "bg-[#1e293b]",
    alert: "bg-[#1e293b] border-[#334155]",
    otpCodeFieldInput: "bg-[#1e293b] border-[#334155] text-white",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
  return (
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
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your FitForge account" } },
        signUp: { start: { title: "Join FitForge", subtitle: "Create your account and start training" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ThemeProvider defaultTheme="dark" storageKey="fitforge-theme">
          <TooltipProvider>
            <Switch>
              <Route path="/" component={() => (
                <>
                  <Show when="signed-in"><Redirect to="/dashboard" /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/dashboard" component={() => (
                <>
                  <Show when="signed-in"><Dashboard /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/workouts" component={() => (
                <>
                  <Show when="signed-in"><Workouts /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/workouts/:id" component={() => (
                <>
                  <Show when="signed-in"><WorkoutDetail /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/exercises" component={() => (
                <>
                  <Show when="signed-in"><Exercises /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/log" component={() => (
                <>
                  <Show when="signed-in"><LogWorkout /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/progress" component={() => (
                <>
                  <Show when="signed-in"><Progress /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/profile" component={() => (
                <>
                  <Show when="signed-in"><Profile /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route path="/settings" component={() => (
                <>
                  <Show when="signed-in"><AccountSettings /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )} />
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function NoAuthApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="fitforge-theme">
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      {clerkPubKey ? <ClerkProviderWithRoutes /> : <NoAuthApp />}
    </WouterRouter>
  );
}

export default App;
