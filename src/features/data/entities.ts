import { createEntity } from "./store";
import type {
  Assignment,
  CalendarEvent,
  Exam,
  Flashcard,
  Goal,
  Note,
  Notification,
  Reminder,
  Resource,
  StudySession,
  Subject,
  Task,
  Topic
} from "./types";

// One factory instance per schema, created once so every screen shares the
// same query keys and mutation/invalidation wiring.
export const subjects = createEntity<Subject>({ schemaName: "Subject", label: "Subject" });
export const topics = createEntity<Topic>({ schemaName: "Topic", label: "Topic" });
export const assignments = createEntity<Assignment>({ schemaName: "Assignment", label: "Assignment" });
export const tasks = createEntity<Task>({ schemaName: "Task", label: "Task" });
export const exams = createEntity<Exam>({ schemaName: "Exam", label: "Exam" });
export const sessions = createEntity<StudySession>({ schemaName: "StudySession", label: "Study session" });
export const goals = createEntity<Goal>({ schemaName: "Goal", label: "Goal" });
export const calendarEvents = createEntity<CalendarEvent>({ schemaName: "CalendarEvent", label: "Personal event" });
export const notes = createEntity<Note>({ schemaName: "Note", label: "Note" });
export const resources = createEntity<Resource>({ schemaName: "Resource", label: "Resource" });
export const flashcards = createEntity<Flashcard>({ schemaName: "Flashcard", label: "Flashcard" });
export const notifications = createEntity<Notification>({ schemaName: "Notification", label: "Notification" });
export const reminders = createEntity<Reminder>({ schemaName: "Reminder", label: "Reminder" });
