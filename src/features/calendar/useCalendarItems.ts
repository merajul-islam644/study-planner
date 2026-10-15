import { useMemo } from "react";
import { assignments as assignmentEntity, calendarEvents, exams as examEntity, goals as goalEntity, sessions as sessionEntity } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { todayISO } from "../../lib/format";

export type CalendarEventKind = "Study session" | "Assignment" | "Exam" | "Personal event" | "Goal deadline";

export type CalendarItem = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  date: string;
  time?: string;
  colourClass: string;
  linkPath: string;
};

const KIND_COLOUR: Record<CalendarEventKind, string> = {
  "Study session": "event-blue",
  Assignment: "event-amber",
  Exam: "event-red",
  "Personal event": "event-grey",
  "Goal deadline": "event-green"
};

// The calendar shows all five event types from their own records -- nothing is
// copied into a separate store. Each item carries its type word beside its
// colour so the type is never carried by colour alone.
export function useCalendarItems() {
  const sessions = sessionEntity.useList();
  const assignments = assignmentEntity.useList();
  const exams = examEntity.useList();
  const events = calendarEvents.useList();
  const goals = goalEntity.useList();

  const items = useMemo<CalendarItem[]>(() => {
    const list: CalendarItem[] = [];
    (sessions.data ?? []).forEach((session) => {
      const date = session.date?.slice(0, 10);
      if (!date) return;
      list.push({ id: `s-${recordId(session)}`, kind: "Study session", title: session.studyType ?? "Study session", date, time: session.startTime, colourClass: KIND_COLOUR["Study session"], linkPath: `/planner?date=${date}` });
    });
    (assignments.data ?? []).forEach((assignment) => {
      const date = assignment.dueDate?.slice(0, 10);
      if (!date) return;
      list.push({ id: `a-${recordId(assignment)}`, kind: "Assignment", title: assignment.title ?? "Assignment", date, colourClass: KIND_COLOUR.Assignment, linkPath: `/assignments/${recordId(assignment)}` });
    });
    (exams.data ?? []).forEach((exam) => {
      const date = exam.dateTime?.slice(0, 10);
      if (!date) return;
      list.push({ id: `e-${recordId(exam)}`, kind: "Exam", title: exam.name ?? "Exam", date, time: exam.dateTime?.slice(11, 16), colourClass: KIND_COLOUR.Exam, linkPath: `/exams/${recordId(exam)}` });
    });
    (events.data ?? []).forEach((event) => {
      const date = event.date?.slice(0, 10);
      if (!date) return;
      list.push({ id: `p-${recordId(event)}`, kind: "Personal event", title: event.title ?? "Personal event", date, time: event.startTime, colourClass: KIND_COLOUR["Personal event"], linkPath: "" });
    });
    (goals.data ?? []).forEach((goal) => {
      const date = goal.deadline?.slice(0, 10);
      if (!date) return;
      list.push({ id: `g-${recordId(goal)}`, kind: "Goal deadline", title: goal.title ?? "Goal", date, colourClass: KIND_COLOUR["Goal deadline"], linkPath: `/goals` });
    });
    return list;
  }, [sessions.data, assignments.data, exams.data, events.data, goals.data]);

  return {
    items,
    isLoading: sessions.isLoading || assignments.isLoading || exams.isLoading || events.isLoading || goals.isLoading,
    today: todayISO()
  };
}

export { KIND_COLOUR };
