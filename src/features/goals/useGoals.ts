import { useMemo } from "react";
import { goals, assignments, topics, sessions } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { todayISO } from "../../lib/format";
import { computeStreak, sessionMinutes } from "../sessions/useSessions";
import { effectiveStatus } from "../assignments/useAssignments";

export function useGoals() {
  return goals.useList();
}

export type GoalProgress = { current: number; target: number; ratio: number; unit: string; label: string };

// Progress is worked out from the student's own records, in the goal type's
// unit. A goal whose deadline passed below target reads Missed.
export function computeGoalProgress(goal: { type?: string; target?: number }, ctx: {
  minutes: number;
  confidentTopics: number;
  totalTopics: number;
  completedAssignments: number;
  totalAssignments: number;
  streak: number;
}): GoalProgress {
  const target = goal.target ?? 0;
  switch (goal.type) {
    case "Complete topics": {
      const current = ctx.confidentTopics;
      return { current, target, ratio: target ? current / target : 0, unit: "topics", label: `${current} of ${target} topics` };
    }
    case "Assignment score": {
      const score = ctx.totalAssignments ? Math.round((ctx.completedAssignments / ctx.totalAssignments) * 100) : 0;
      return { current: score, target, ratio: target ? score / target : 0, unit: "%", label: `${score}% of ${target}%` };
    }
    case "Study streak": {
      const current = ctx.streak;
      return { current, target, ratio: target ? current / target : 0, unit: "days", label: `${current} of ${target} days` };
    }
    case "Study hours":
    default: {
      const current = ctx.minutes / 60;
      return { current, target, ratio: target ? current / target : 0, unit: "hours", label: `${formatHours(ctx.minutes)} of ${target}h` };
    }
  }
}

export function useGoalRows() {
  const goalsList = useGoals();
  const assignmentsList = assignments.useList();
  const topicsList = topics.useList();
  const sessionsList = sessions.useList();

  const rows = useMemo(() => {
    if (!goalsList.data) return undefined;
    const allSessions = sessionsList.data ?? [];
    const monthStart = `${todayISO().slice(0, 7)}-01`;
    const minutesThisMonth = allSessions
      .filter((session) => (session.date?.slice(0, 10) ?? "") >= monthStart)
      .reduce((total, session) => total + sessionMinutes(session), 0);
    const streak = computeStreak(allSessions);
    const allTopics = topicsList.data ?? [];
    const allAssignments = assignmentsList.data ?? [];

    return goalsList.data.map((goal) => {
      const progress = computeGoalProgress(goal, {
        minutes: minutesThisMonth,
        confidentTopics: allTopics.filter((topic) => topic.status === "Confident" || topic.status === "Reviewed").length,
        totalTopics: allTopics.length,
        completedAssignments: allAssignments.filter((assignment) => effectiveStatus(assignment) === "Completed").length,
        totalAssignments: allAssignments.length,
        streak
      });
      const deadlinePassed = (goal.deadline?.slice(0, 10) ?? "") < todayISO();
      const met = progress.ratio >= 1;
      const status = met ? "Met" : deadlinePassed ? "Missed" : "Active";
      return { goal, id: recordId(goal), progress, status, deadlinePassed, met };
    });
  }, [goalsList.data, assignmentsList.data, topicsList.data, sessionsList.data]);

  return { data: rows, isLoading: goalsList.isLoading };
}

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
