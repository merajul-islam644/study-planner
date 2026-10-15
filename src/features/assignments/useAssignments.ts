import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { assignments, subjects, tasks } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { todayISO } from "../../lib/format";
import type { Assignment } from "../data/types";

export type AssignmentFilter = "All" | "Today" | "Upcoming" | "Overdue" | "Completed";

// "Overdue" is set automatically when the due date passes unfinished: the
// derived status overrides the stored one so the list and detail always agree.
export function effectiveStatus(assignment: Assignment): Assignment["status"] {
  if (assignment.status === "Completed") return "Completed";
  const due = assignment.dueDate?.slice(0, 10);
  if (due && due < todayISO()) return "Overdue";
  return assignment.status ?? "Not Started";
}

export function filterAssignments(list: Assignment[], filter: AssignmentFilter, subjectFilter: string[], priorityFilter: string): Assignment[] {
  const today = todayISO();
  return list.filter((assignment) => {
    const due = assignment.dueDate?.slice(0, 10) ?? "";
    const status = effectiveStatus(assignment);

    if (filter === "Completed" && status !== "Completed") return false;
    if (filter === "Overdue" && status !== "Overdue") return false;
    if (filter === "Today" && (due !== today || status === "Completed")) return false;
    if (filter === "Upcoming" && (due < today || status === "Completed")) return false;
    if (filter === "All" && status === "Overdue") {
      // Overdue items stay visible under All as well.
    }

    if (subjectFilter.length > 0 && !subjectFilter.includes(assignment.subjectId ?? "")) return false;
    if (priorityFilter && priorityFilter !== "All" && assignment.priority !== priorityFilter) return false;
    return true;
  });
}

export function useAssignments() {
  return assignments.useList();
}

export function useAssignment(id: string | undefined) {
  const list = assignments.useList();
  return { ...list, data: (list.data ?? []).find((item) => recordId(item) === id) };
}

export function useSubjectMap() {
  const list = subjects.useList();
  return useMemo(() => {
    const map = new Map<string, string>();
    (list.data ?? []).forEach((subject) => map.set(recordId(subject), subject.name ?? ""));
    return map;
  }, [list.data]);
}

// Ticking the last checklist item completes the assignment without asking.
export function useChecklistSync() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["Task"] });
}

export function useAssignmentTasks(assignmentId: string | undefined) {
  const list = tasks.useList();
  return { ...list, data: (list.data ?? []).filter((task) => task.assignmentId === assignmentId) };
}
