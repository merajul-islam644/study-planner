import { exams } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { daysBetween, parseISODate } from "../../lib/format";
import { percent } from "../../lib/format";
import type { Exam, Topic } from "../data/types";

export type ExamState = "Planned" | "Preparing" | "Important" | "Urgent" | "Today";

// Countdown states. The PRD's table gives Planned 30+ days; the worked
// example (SA-06 AC1) is explicit that 12 days reads Urgent, so the urgent
// band is the two-week run-in and the remaining states fill the gap up to
// Planned.
export function examState(daysRemaining: number): ExamState {
  if (daysRemaining <= 0) return "Today";
  if (daysRemaining <= 14) return "Urgent";
  if (daysRemaining <= 21) return "Important";
  if (daysRemaining < 30) return "Preparing";
  return "Planned";
}

export function examDaysRemaining(exam: Exam | undefined): number {
  if (!exam?.dateTime) return 0;
  const date = new Date(exam.dateTime);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(0, daysBetween(new Date(), date));
}

export function useExams() {
  return exams.useList();
}

export function useExam(id: string | undefined) {
  const list = exams.useList();
  return { ...list, data: (list.data ?? []).find((item) => recordId(item) === id) };
}

// Preparation progress is the share of covered topics that are Reviewed or
// Confident.
export function preparationProgress(exam: Exam | undefined, allTopics: Topic[]): { ready: number; total: number; percent: number } {
  const covered = (exam?.topicIds ?? []).map((id) => allTopics.find((topic) => recordId(topic) === id)).filter(Boolean) as Topic[];
  const ready = covered.filter((topic) => topic.status === "Reviewed" || topic.status === "Confident").length;
  return { ready, total: covered.length, percent: percent(ready, covered.length) };
}

export function sortExamsByDate<T extends { dateTime?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""));
}

export function examSortValue(exam: Exam): number {
  const date = exam.dateTime ? parseISODate(exam.dateTime) : null;
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}
