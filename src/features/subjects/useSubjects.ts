import { useMemo } from "react";
import { subjects, topics, sessions, exams, assignments } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { toISODate, todayISO } from "../../lib/format";
import type { Subject, Topic } from "../data/types";

export function useSubjectsList() {
  return subjects.useList();
}

export function useTopicsList() {
  return topics.useList();
}

export function useSubject(id: string | undefined) {
  const list = subjects.useList();
  return {
    ...list,
    data: (list.data ?? []).find((item) => recordId(item) === id)
  };
}

// A subject's progress is the share of its topics that are Reviewed or
// Confident, matching the PRD's examples.
export function topicProgress(topicsForSubject: Topic[]): number {
  if (topicsForSubject.length === 0) return 0;
  const ready = topicsForSubject.filter((topic) => topic.status === "Reviewed" || topic.status === "Confident").length;
  return Math.round((ready / topicsForSubject.length) * 100);
}

export type SubjectSummary = {
  subject: Subject;
  id: string;
  topicCount: number;
  progress: number;
  totalMinutes: number;
  nextExamDate?: string;
};

export function useSubjectSummaries(): { data: SubjectSummary[] | undefined; isLoading: boolean } {
  const subjectsList = subjects.useList();
  const topicsList = topics.useList();
  const sessionsList = sessions.useList();
  const examsList = exams.useList();

  const summaries = useMemo(() => {
    if (!subjectsList.data) return undefined;
    const allTopics = topicsList.data ?? [];
    const allSessions = sessionsList.data ?? [];
    const allExams = examsList.data ?? [];
    const today = todayISO();

    return subjectsList.data.map((subject) => {
      const id = recordId(subject);
      const subjectTopics = allTopics.filter((topic) => topic.subjectId === id);
      const minutes = allSessions
        .filter((session) => session.subjectId === id && (session.status === "Completed" || session.actualMinutes))
        .reduce((total, session) => total + (session.actualMinutes || session.durationMinutes || 0), 0);
      const upcomingExams = allExams
        .filter((exam) => exam.subjectId === id && (exam.dateTime?.slice(0, 10) ?? "") >= today)
        .sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""));
      return {
        subject,
        id,
        topicCount: subjectTopics.length,
        progress: topicProgress(subjectTopics),
        totalMinutes: minutes,
        nextExamDate: upcomingExams[0]?.dateTime
      };
    });
  }, [subjectsList.data, topicsList.data, sessionsList.data, examsList.data]);

  return { data: summaries, isLoading: subjectsList.isLoading };
}

export function useSubjectAssignments(subjectId: string | undefined) {
  const list = assignments.useList();
  return { ...list, data: (list.data ?? []).filter((item) => item.subjectId === subjectId) };
}

export function useSubjectSessions(subjectId: string | undefined) {
  const list = sessions.useList();
  return { ...list, data: (list.data ?? []).filter((item) => item.subjectId === subjectId) };
}

export function useSubjectExams(subjectId: string | undefined) {
  const list = exams.useList();
  return { ...list, data: (list.data ?? []).filter((item) => item.subjectId === subjectId) };
}

export function buildSuggestedCode(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z ]/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return "";
  if (words.length === 1) return first.slice(0, 4).toUpperCase();
  return words.map((word) => word.charAt(0)).join("").slice(0, 5).toUpperCase();
}

export { toISODate };
