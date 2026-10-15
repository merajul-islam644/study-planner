import { Trash2 } from "lucide-react";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { useToast } from "../../shared/ui/toast";
import { subjects, topics, assignments, exams, sessions, goals, notes, resources, flashcards } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatDateMedium } from "../../lib/format";
import type { BaseRecord } from "../../lib/blocks/data";

type Deleted = { id: string; label: string; type: string; deletedAt: string; restore: () => void };

// Deleted records go to a trash and can be restored for 30 days.
export function TrashPage() {
  const { show } = useToast();
  const sources = [
    { type: "Subject", entity: subjects, label: (r: Record<string, unknown>) => String(r.name ?? "Subject") },
    { type: "Topic", entity: topics, label: (r: Record<string, unknown>) => String(r.name ?? "Topic") },
    { type: "Assignment", entity: assignments, label: (r: Record<string, unknown>) => String(r.title ?? "Assignment") },
    { type: "Exam", entity: exams, label: (r: Record<string, unknown>) => String(r.name ?? "Exam") },
    { type: "Study session", entity: sessions, label: (r: Record<string, unknown>) => `${r.studyType ?? "Session"} · ${r.date ?? ""}` },
    { type: "Goal", entity: goals, label: (r: Record<string, unknown>) => String(r.title ?? "Goal") },
    { type: "Note", entity: notes, label: (r: Record<string, unknown>) => String(r.title ?? "Note") },
    { type: "Resource", entity: resources, label: (r: Record<string, unknown>) => String(r.title ?? "Resource") },
    { type: "Flashcard", entity: flashcards, label: (r: Record<string, unknown>) => String(r.question ?? "Flashcard") }
  ];

  const lists = sources.map((source) => ({ ...source, query: source.entity.useList({ includeDeleted: true }), mutations: source.entity.useMutations() }));
  const isLoading = lists.some((entry) => entry.query.isLoading);

  const rows: Deleted[] = [];
  lists.forEach((entry) => {
    (entry.query.data ?? []).forEach((record) => {
      const raw = record as unknown as Record<string, unknown>;
      const deletedAt = String(raw.deletedAt ?? "");
      if (!deletedAt) return;
      rows.push({
        id: `${entry.type}-${recordId(record as BaseRecord)}`,
        label: entry.label(raw),
        type: entry.type,
        deletedAt,
        restore: () => entry.mutations.restore.mutate({ id: recordId(record as BaseRecord) }, { onSuccess: () => show(`${entry.label(raw)} restored.`, "success") })
      });
    });
  });

  return (
    <section>
      <PageHeader title="Trash" subtitle="Deleted records you can restore for 30 days." />

      {isLoading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <EmptyState icon={<Trash2 size={26} />} title="Trash is empty" description="Deleted subjects, sessions, goals and more appear here for 30 days." />
      ) : (
        <div className="list-stack">
          {rows.map((row) => {
            const daysLeft = 30 - Math.max(0, Math.round((Date.now() - new Date(row.deletedAt).getTime()) / 86_400_000));
            return (
              <div key={row.id} className="list-row">
                <div className="list-row-main">
                  <strong>{row.label}</strong>
                  <span className="muted">{row.type} · deleted {formatDateMedium(row.deletedAt)} · restorable for {Math.max(0, daysLeft)} more days</span>
                </div>
                <button className="ghost-button" onClick={row.restore} disabled={daysLeft <= 0}>{daysLeft <= 0 ? "Expired" : "Restore"}</button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
