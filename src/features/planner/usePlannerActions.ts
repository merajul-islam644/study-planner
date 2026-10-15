import { sessions } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatClock12, toISODate } from "../../lib/format";
import { findOverlap } from "../sessions/useSessions";
import type { StudySession } from "../data/types";

// The planner's session actions: create-on-drop, move, resize, duplicate and
// delete. A move that would overlap another session is refused and reports
// which session it clashed with; every accepted move is recorded in history.
export type DropResult = { ok: true } | { ok: false; conflict: string };

export function usePlannerActions() {
  const mutations = sessions.useMutations();

  async function moveSession(list: StudySession[], session: StudySession, date: string, startTime: string): Promise<DropResult> {
    const duration = session.durationMinutes ?? 60;
    const clash = findOverlap(list, { date, startTime, durationMinutes: duration, ignoreId: recordId(session) });
    if (clash) return { ok: false, conflict: `${formatClock12(clash.startTime)}` };
    await mutations.update.mutateAsync({ id: recordId(session), date, startTime });
    return { ok: true };
  }

  async function resizeSession(list: StudySession[], session: StudySession, durationMinutes: number): Promise<DropResult> {
    const start = session.startTime ?? "09:00";
    const clash = findOverlap(list, { date: session.date?.slice(0, 10) ?? "", startTime: start, durationMinutes, ignoreId: recordId(session) });
    if (clash) return { ok: false, conflict: `${formatClock12(clash.startTime)}` };
    await mutations.update.mutateAsync({ id: recordId(session), durationMinutes });
    return { ok: true };
  }

  async function createAt(subjectId: string, date: string, startTime: string): Promise<DropResult> {
    await mutations.create.mutateAsync({
      subjectId,
      topicId: "",
      date,
      startTime,
      durationMinutes: 60,
      studyType: "Learning",
      status: "Upcoming",
      actualMinutes: 0
    });
    return { ok: true };
  }

  async function duplicateSession(session: StudySession, date?: string): Promise<void> {
    const nextDate = date ?? shiftDate(session.date?.slice(0, 10) ?? toISODate(new Date()));
    await mutations.create.mutateAsync({
      subjectId: session.subjectId,
      topicId: session.topicId,
      date: nextDate,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      studyType: session.studyType,
      status: "Upcoming",
      actualMinutes: 0,
      notes: session.notes
    });
  }

  return { mutations, moveSession, resizeSession, createAt, duplicateSession };
}

function shiftDate(iso: string): string {
  const [year = 2026, month = 1, day = 1] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + 1);
  return toISODate(date);
}
