import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../layout/AppShell";
import { NavigationProvider } from "./navigation";
import { RedirectIfAuthenticated, RequireAuth } from "./guards";
import { OnboardingGate } from "./OnboardingGate";
import { CallbackPage } from "../../features/auth/CallbackPage";
import { ErrorPage } from "../../features/auth/ErrorPage";
import { LoginPage } from "../../features/auth/LoginPage";
import { NotFoundPage } from "../../features/auth/NotFoundPage";
import { DashboardPage } from "../../features/dashboard/DashboardPage";
import { ProfilePage } from "../../features/profile/ProfilePage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { OnboardingPage } from "../../features/onboarding/OnboardingPage";
import { SubjectsPage } from "../../features/subjects/SubjectsPage";
import { SubjectDetailPage } from "../../features/subjects/SubjectDetailPage";
import { AssignmentsPage } from "../../features/assignments/AssignmentsPage";
import { AssignmentDetailPage } from "../../features/assignments/AssignmentDetailPage";
import { ExamsPage } from "../../features/exams/ExamsPage";
import { ExamDetailPage } from "../../features/exams/ExamDetailPage";
import { SessionsPage } from "../../features/sessions/SessionsPage";
import { FocusMode } from "../../features/sessions/FocusMode";
import { PlannerPage } from "../../features/planner/PlannerPage";
import { ProgressPage } from "../../features/progress/ProgressPage";
import { GoalsPage } from "../../features/goals/GoalsPage";
import { CalendarPage } from "../../features/calendar/CalendarPage";
import { SearchPage } from "../../features/search/SearchPage";
import { NotificationsPage } from "../../features/notifications/NotificationsPage";
import { TrashPage } from "../../features/trash/TrashPage";

type RouteParams = Record<string, string>;
function matchPath(pattern: string, path: string): RouteParams | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: RouteParams = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const segment = patternParts[index] ?? "";
    const pathSegment = pathParts[index] ?? "";
    if (segment.startsWith(":")) {
      params[segment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (segment !== pathSegment) {
      return null;
    }
  }
  return params;
}

type Route = { pattern: string; render: (params: RouteParams) => JSX.Element };

// The app's own section pages, in the order the sidebar presents them.
const routes: Route[] = [
  { pattern: "/dashboard", render: () => <DashboardPage /> },
  { pattern: "/planner", render: () => <PlannerPage /> },
  { pattern: "/subjects", render: () => <SubjectsPage /> },
  { pattern: "/subjects/:id", render: (params) => <SubjectDetailPage subjectId={params.id ?? ""} /> },
  { pattern: "/assignments", render: () => <AssignmentsPage /> },
  { pattern: "/assignments/:id", render: (params) => <AssignmentDetailPage assignmentId={params.id ?? ""} /> },
  { pattern: "/exams", render: () => <ExamsPage /> },
  { pattern: "/exams/:id", render: (params) => <ExamDetailPage examId={params.id ?? ""} /> },
  { pattern: "/sessions", render: () => <SessionsPage /> },
  { pattern: "/focus", render: () => <FocusMode /> },
  { pattern: "/progress", render: () => <ProgressPage /> },
  { pattern: "/goals", render: () => <GoalsPage /> },
  { pattern: "/calendar", render: () => <CalendarPage /> },
  { pattern: "/search", render: () => <SearchPage /> },
  { pattern: "/notifications", render: () => <NotificationsPage /> },
  { pattern: "/trash", render: () => <TrashPage /> },
  { pattern: "/settings", render: () => <SettingsPage /> },
  { pattern: "/profile", render: () => <ProfilePage /> },
  { pattern: "/error", render: () => <ErrorPage /> }
];

export function AppRouter() {
  const [path, setPath] = useState(() => window.location.pathname);
  const [search, setSearch] = useState(() => window.location.search);

  useEffect(() => {
    const onPopState = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(nextPath: string) {
    const [nextPathname = "/", queryString = ""] = nextPath.split("?");
    window.history.pushState({}, "", nextPath);
    setPath(nextPathname);
    setSearch(queryString ? `?${queryString}` : "");
  }

  const navigateStable = useMemo(() => navigate, []);

  if (path === "/login/callback") {
    return (
      <NavigationProvider value={navigateStable}>
        <CallbackPage onNavigate={navigateStable} />
      </NavigationProvider>
    );
  }

  if (path === "/login") {
    const returnTo = new URLSearchParams(search).get("returnTo") || undefined;
    return (
      <NavigationProvider value={navigateStable}>
        <RedirectIfAuthenticated onNavigate={navigateStable}>
          <LoginPage returnTo={returnTo} />
        </RedirectIfAuthenticated>
      </NavigationProvider>
    );
  }

  // "/" is the app's home and lands on the dashboard.
  const activePath = path === "/" ? "/dashboard" : path;

  if (activePath === "/onboarding") {
    return (
      <NavigationProvider value={navigateStable}>
        <RequireAuth currentPath={path} onNavigate={navigateStable}>
          <OnboardingPage />
        </RequireAuth>
      </NavigationProvider>
    );
  }

  const matched = routes
    .map((route) => ({ route, params: matchPath(route.pattern, activePath) }))
    .find((entry) => entry.params !== null);

  if (!matched || matched.params === null) {
    return (
      <NavigationProvider value={navigateStable}>
        <NotFoundPage onNavigate={navigateStable} />
      </NavigationProvider>
    );
  }

  return (
    <NavigationProvider value={navigateStable}>
      <RequireAuth currentPath={path} onNavigate={navigateStable}>
        <OnboardingGate>
          <AppShell activePath={activePath} onNavigate={navigateStable}>
            {matched.route.render(matched.params)}
          </AppShell>
        </OnboardingGate>
      </RequireAuth>
    </NavigationProvider>
  );
}
