import { useMemo } from "react";
import { sessions } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { addDays, parseISODate, startOfWeek, timeToMinutes, toISODate, todayISO } from "../../lib/format";
import type { SessionStatus, StudySession } from "../data/types";

export function useSessions() {
  return sessions.useList();
}

export function sessionId(session: StudySession): string {
  return recordId(session);
}

// A session whose start time has passed and is unfinished reads In Progress.
export function effectiveSessionStatus(session: StudySession, now = new Date()): SessionStatus {
  if (session.status === "Completed" || session.status === "Skipped") return session.status;
  const date = session.date?.slice(0, 10);
  if (!date) return session.status ?? "Upcoming";
  const start = new Date(`${date}T${session.startTime ?? "00:00"}:00`);
  if (Number.isNaN(start.getTime())) return session.status ?? "Upcoming";
  if (start <= now) return "In Progress";
  return "Upcoming";
}

export function sessionMinutes(session: StudySession): number {
  return session.actualMinutes || (session.status === "Completed" ? session.durationMinutes ?? 0 : 0);
}

export function plannedMinutes(session: StudySession): number {
  return session.durationMinutes ?? 0;
}

export function sessionsOnDate(list: StudySession[], isoDate: string): StudySession[] {
  return list
    .filter((session) => session.date?.slice(0, 10) === isoDate)
    .sort((a, b) => timeToMinutes(a.startTime ?? "00:00") - timeToMinutes(b.startTime ?? "00:00"));
}

export function sessionsInWeek(list: StudySession[], weekStart: Date): StudySession[] {
  const start = toISODate(weekStart);
  const end = toISODate(addDays(weekStart, 6));
  return list.filter((session) => {
    const date = session.date?.slice(0, 10) ?? "";
    return date >= start && date <= end;
  });
}

// Overlapping means two sessions on the same date whose [start, start+duration)
// ranges intersect.
export function findOverlap(list: StudySession[], candidate: { date: string; startTime: string; durationMinutes: number; ignoreId?: string }): StudySession | undefined {
  const start = timeToMinutes(candidate.startTime);
  const end = start + candidate.durationMinutes;
  return list.find((session) => {
    if (recordId(session) === candidate.ignoreId) return false;
    if (session.date?.slice(0, 10) !== candidate.date) return false;
    const otherStart = timeToMinutes(session.startTime ?? "00:00");
    const otherEnd = otherStart + (session.durationMinutes ?? 0);
    return start < otherEnd && otherStart < end;
  });
}

export function useTodaySessions(): StudySession[] {
  const list = useSessions();
  return useMemo(() => sessionsOnDate(list.data ?? [], todayISO()), [list.data]);
}

// A streak is consecutive days (up to today) with at least one completed or
// focused session. A day with none resets it to 0.
export function computeStreak(list: StudySession[], today = new Date()): number {
  const completedDays = new Set(
    list.filter((session) => sessionMinutes(session) > 0).map((session) => session.date?.slice(0, 10) ?? "")
  );
  let streak = 0;
  let cursor = new Date(today);
  // Allow today to be empty without breaking yesterday's streak until the day
  // ends: if today has no session, start counting from yesterday.
  if (!completedDays.has(toISODate(cursor))) cursor = addDays(cursor, -1);
  while (completedDays.has(toISODate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function minutesForDate(list: StudySession[], isoDate: string): number {
  return list
    .filter((session) => session.date?.slice(0, 10) === isoDate)
    .reduce((total, session) => total + sessionMinutes(session), 0);
}

export function minutesInWeek(list: StudySession[], weekStart: Date): number {
  return sessionsInWeek(list, weekStart).reduce((total, session) => total + sessionMinutes(session), 0);
}

export function currentWeekStart(): Date {
  return startOfWeek(new Date());
}

export function weekdayMinutes(list: StudySession[], weekStart: Date): { day: string; date: Date; minutes: number }[] {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      day: names[index] ?? "",
      date,
      minutes: minutesForDate(list, toISODate(date))
    };
  });
}

export function sessionsForCalendarRange(list: StudySession[], from: Date, to: Date): StudySession[] {
  const start = toISODate(from);
  const end = toISODate(to);
  return list.filter((session) => {
    const date = session.date?.slice(0, 10) ?? "";
    return date >= start && date <= end;
  });
}

export { parseISODate };
