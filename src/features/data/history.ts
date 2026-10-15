import { useQueryClient } from "@tanstack/react-query";
import { blocksClient } from "../../lib/blocks/client";
import type { ChangeLog } from "./types";

// Every change to a subject, topic, assignment, exam, session, goal or
// flashcard records who changed it, when and what. The audit entry is itself a
// Blocks Data record, owned by the same student.
const changeLogs = blocksClient.data.collection<ChangeLog>("ChangeLog");

export type HistoryEntry = {
  entityType: string;
  entityId: string;
  entityName: string;
  action: "Created" | "Updated" | "Deleted" | "Restored" | "Moved";
  summary: string;
};

export async function writeHistory(ownerId: string, actorName: string, entry: HistoryEntry): Promise<void> {
  try {
    await changeLogs.create({
      ownerId,
      actorName,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityName: entry.entityName,
      action: entry.action,
      summary: entry.summary
    });
  } catch {
    // History is important but must never block the change itself; a failed
    // audit write is surfaced nowhere rather than failing the user's save.
  }
}

export function useInvalidateAll(): () => void {
  const client = useQueryClient();
  return () => client.invalidateQueries();
}
