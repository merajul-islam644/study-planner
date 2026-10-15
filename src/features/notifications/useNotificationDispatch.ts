import { useEffect, useRef } from "react";
import { notifications, reminders, assignments, exams, goals, sessions } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { useOwnerId, useProfile } from "../data/store";
import { addMinutesToTime, daysBetween, todayISO } from "../../lib/format";
import { effectiveStatus } from "../assignments/useAssignments";

export type NotificationPrefs = { study: boolean; assignment: boolean; exam: boolean; goal: boolean };

export function parsePrefs(raw: string | undefined): NotificationPrefs {
  const fallback: NotificationPrefs = { study: true, assignment: true, exam: true, goal: true };
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

// The app raises notifications from the student's own records and reminder
// settings. Each reminder is sent once: a Reminder record records that it
// fired, and turning a topic off in Settings stops it entirely.
export function useNotificationDispatch() {
  const ownerId = useOwnerId();
  const profile = useProfile();
  const sessionsList = sessions.useList();
  const assignmentsList = assignments.useList();
  const examsList = exams.useList();
  const goalsList = goals.useList();
  const remindersList = reminders.useList();
  const notificationsList = notifications.useList();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!ownerId || ranRef.current) return;
    if (sessionsList.isLoading || assignmentsList.isLoading || examsList.isLoading || remindersList.isLoading || notificationsList.isLoading) return;
    ranRef.current = true;

    const prefs = parsePrefs(profile.data?.notificationPrefs);
    const existingKeys = new Set((notificationsList.data ?? []).map((entry) => entry.link ?? ""));
    const sentReminders = new Set((remindersList.data ?? []).filter((reminder) => reminder.sent).map((reminder) => recordId(reminder)));
    const now = new Date();

    async function raise(topic: string, kind: string, message: string, link: string) {
      if (existingKeys.has(link)) return;
      existingKeys.add(link);
      await notifications.handle.create({ ownerId, topic, kind, message, link, read: false });
    }

    async function run() {
      // Assignment due tomorrow.
      if (prefs.assignment) {
        for (const assignment of assignmentsList.data ?? []) {
          const due = assignment.dueDate?.slice(0, 10);
          if (!due || effectiveStatus(assignment) === "Completed") continue;
          const diff = daysBetween(new Date(), new Date(`${due}T00:00:00`));
          if (diff === 1) {
            const subject = assignment.title ?? "An assignment";
            await raise("Assignment reminders", "assignment", `${subject} is due tomorrow.`, `a-${recordId(assignment)}`);
          }
        }
      }

      // Session reminders at their offsets (once each).
      if (prefs.study) {
        for (const session of sessionsList.data ?? []) {
          const offset = session.reminderOffsetMinutes;
          if (!offset || !session.date || !session.startTime) continue;
          const fireAt = new Date(`${session.date.slice(0, 10)}T${addMinutesToTime(session.startTime, -offset)}:00`);
          if (Number.isNaN(fireAt.getTime()) || fireAt > now) continue;
          const reminder = (remindersList.data ?? []).find((entry) => entry.refType === "Study session" && entry.refId === recordId(session));
          if (reminder && sentReminders.has(recordId(reminder))) continue;
          await raise("Study reminders", "study", `Your study session starts at ${session.startTime}.`, `s-${recordId(session)}`);
          if (reminder) {
            await reminders.handle.update(recordId(reminder), { sent: true });
            sentReminders.add(recordId(reminder));
          } else {
            await reminders.handle.create({ ownerId, refType: "Study session", refId: recordId(session), offsetMinutes: offset, sent: true, title: "Study session" });
          }
        }
      }

      // Exam reminders.
      if (prefs.exam) {
        for (const exam of examsList.data ?? []) {
          const date = exam.dateTime?.slice(0, 10);
          if (!date) continue;
          const diff = daysBetween(new Date(), new Date(`${date}T00:00:00`));
          if (diff === 1) await raise("Exam reminders", "exam", `${exam.name} is tomorrow.`, `e-${recordId(exam)}`);
        }
      }

      // Goal deadlines.
      if (prefs.goal) {
        for (const goal of goalsList.data ?? []) {
          const date = goal.deadline?.slice(0, 10);
          if (!date) continue;
          const diff = daysBetween(new Date(), new Date(`${date}T00:00:00`));
          if (diff === 0) await raise("Goal reminders", "goal", `${goal.title} is due today.`, `g-${recordId(goal)}`);
        }
      }
    }

    void run();
  }, [ownerId, profile.data, sessionsList.data, assignmentsList.data, examsList.data, goalsList.data, remindersList.data, notificationsList.data, sessionsList.isLoading, assignmentsList.isLoading, examsList.isLoading, remindersList.isLoading, notificationsList.isLoading]);
}
