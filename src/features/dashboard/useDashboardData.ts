import { useMemo } from "react";
import { assignments, exams, subjects, tasks } from "../data/entities";
import { formatClock12, todayISO } from "../../lib/format";
import { useProfile } from "../data/store";
import { effectiveSessionStatus, computeStreak, minutesForDate, useSessions, weekdayMinutes, currentWeekStart } from "../sessions/useSessions";
import { effectiveStatus } from "../assignments/useAssignments";
import { useSubjectMap } from "../assignments/useAssignments";
import type { StudySession } from "../data/types";

export function useDashboardData() {
  const profile = useProfile();
  const sessionsList = useSessions();
  const assignmentsList = assignments.useList();
  const examsList = exams.useList();
  const tasksList = tasks.useList();
  const subjectsList = subjects.useList();
  const subjectMap = useSubjectMap();

  const data = useMemo(() => {
    const allSessions = sessionsList.data ?? [];
    const today = todayISO();
    const dailyTarget = profile.data?.dailyTargetMinutes || 120;

    const todayMinutes = minutesForDate(allSessions, today);
    const todaySessions = allSessions
      .filter((session) => session.date?.slice(0, 10) === today)
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

    const allTasks = tasksList.data ?? [];
    const tasksToday = allTasks.filter((task) => task.dueDate?.slice(0, 10) === today);
    const tasksDone = tasksToday.filter((task) => task.done).length;

    const upcomingExams = [...(examsList.data ?? [])]
      .filter((exam) => (exam.dateTime?.slice(0, 10) ?? "") >= today)
      .sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""));

    const upcomingAssignments = [...(assignmentsList.data ?? [])]
      .filter((assignment) => effectiveStatus(assignment) !== "Completed" && (assignment.dueDate?.slice(0, 10) ?? "") >= today)
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

    const week = weekdayMinutes(allSessions, currentWeekStart());
    const weekTasksDone = allTasks.filter((task) => task.done);
    const weekWithMeasures = week.map((entry) => {
      const iso = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, "0")}-${String(entry.date.getDate()).padStart(2, "0")}`;
      return {
        ...entry,
        tasks: weekTasksDone.filter((task) => task.dueDate?.slice(0, 10) === iso).length,
        sessions: allSessions.filter((session) => session.date?.slice(0, 10) === iso).length
      };
    });

    return {
      dailyTarget,
      todayMinutes,
      todaySessions,
      tasksToday: tasksToday.length,
      tasksDone,
      upcomingExams,
      upcomingAssignments,
      streak: computeStreak(allSessions),
      weeklyMinutes: week.reduce((total, entry) => total + entry.minutes, 0),
      week: weekWithMeasures,
      subjectCount: (subjectsList.data ?? []).length
    };
  }, [profile.data, sessionsList.data, tasksList.data, examsList.data, assignmentsList.data, subjectsList.data]);

  return { ...data, subjectMap, isLoading: sessionsList.isLoading || profile.isLoading };
}

export type SessionRow = StudySession & { statusLabel: ReturnType<typeof effectiveSessionStatus> };

export function sessionRowLabel(session: StudySession, subjectMap: Map<string, string>): string {
  const subject = subjectMap.get(session.subjectId ?? "") ?? "Subject";
  const status = effectiveSessionStatus(session);
  return `${formatClock12(session.startTime)} — ${subject}, ${session.studyType}, ${session.durationMinutes} min, ${status}`;
}
