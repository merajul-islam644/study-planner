import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Settings,
  Target,
  Timer,
  TrendingUp
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/planner", labelKey: "nav.planner", icon: CalendarDays },
  { href: "/subjects", labelKey: "nav.subjects", icon: BookOpen },
  { href: "/assignments", labelKey: "nav.assignments", icon: ClipboardList },
  { href: "/exams", labelKey: "nav.exams", icon: GraduationCap },
  { href: "/sessions", labelKey: "nav.sessions", icon: Timer },
  { href: "/progress", labelKey: "nav.progress", icon: TrendingUp },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/settings", labelKey: "nav.settings", icon: Settings }
] as const;

// The mobile bar carries the five destinations the PRD names; everything
// else is reachable from the "More" sheet.
export const mobileNavItems = [
  { href: "/dashboard", labelKey: "nav.home", icon: LayoutDashboard },
  { href: "/planner", labelKey: "nav.planner", icon: CalendarDays },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/progress", labelKey: "nav.progress", icon: TrendingUp }
] as const;

export const mobileMoreItems = [
  { href: "/subjects", labelKey: "nav.subjects", icon: BookOpen },
  { href: "/assignments", labelKey: "nav.assignments", icon: ClipboardList },
  { href: "/exams", labelKey: "nav.exams", icon: GraduationCap },
  { href: "/sessions", labelKey: "nav.sessions", icon: Timer },
  { href: "/goals", labelKey: "nav.goals", icon: Target },
  { href: "/trash", labelKey: "nav.trash", icon: ListChecks },
  { href: "/settings", labelKey: "nav.settings", icon: Settings }
] as const;

export function matchesNavItem(href: string, activePath: string): boolean {
  return activePath === href || activePath.startsWith(`${href}/`);
}
