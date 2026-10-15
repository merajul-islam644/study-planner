import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { assignments, tasks } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { todayISO } from "../../lib/format";
import type { Assignment, Task } from "../data/types";

// Checklist items are Task records. Ticking every item completes the
// assignment automatically, with no confirmation; unticking never asks.
export function ChecklistSection({ assignment, onChanged }: { assignment: Assignment; onChanged?: () => void }) {
  const list = tasks.useList();
  const mutations = tasks.useMutations();
  const assignmentMutations = assignments.useMutations();
  const [title, setTitle] = useState("");
  const [removing, setRemoving] = useState<Task | null>(null);

  const items = (list.data ?? []).filter((task) => task.assignmentId === recordId(assignment));
  const doneCount = items.filter((task) => task.done).length;

  function toggle(task: Task) {
    const id = recordId(task);
    const nextDone = !task.done;
    mutations.update.mutate({ id, done: nextDone }, {
      onSuccess: () => {
        const willComplete = items.every((item) => (recordId(item) === id ? nextDone : item.done));
        if (willComplete && assignment.status !== "Completed") {
          assignmentMutations.update.mutate({ id: recordId(assignment), status: "Completed" });
        }
        if (!nextDone && assignment.status === "Completed") {
          assignmentMutations.update.mutate({ id: recordId(assignment), status: "In Progress" });
        }
        onChanged?.();
      }
    });
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Checklist</h3>
        <span className="muted">{doneCount} of {items.length} done</span>
      </div>

      {items.length === 0 ? <p className="muted">No checklist items yet.</p> : null}
      {items.map((task) => (
        <div key={recordId(task)} className={`checklist-item ${task.done ? "done" : ""}`}>
          <input type="checkbox" checked={Boolean(task.done)} onChange={() => toggle(task)} aria-label={task.title} />
          <span className="checklist-title">{task.title}</span>
          <button className="icon-button" title="Remove item" onClick={() => setRemoving(task)}><Trash2 size={15} /></button>
        </div>
      ))}

      <form
        className="row mt8"
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          mutations.create.mutate({ assignmentId: recordId(assignment), title: title.trim(), done: false, dueDate: assignment.dueDate?.slice(0, 10) || todayISO() });
          setTitle("");
        }}
      >
        <input className="grow" style={{ height: 40, border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", padding: "0 10px", background: "hsl(var(--card))" }} placeholder="Add a checklist item" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button className="ghost-button" type="submit"><Plus size={15} /> Add</button>
      </form>

      {removing ? (
        <ConfirmDialog
          title="Remove checklist item"
          message="Remove this checklist item? This cannot be undone."
          onCancel={() => setRemoving(null)}
          onConfirm={() => mutations.remove.mutate({ id: recordId(removing) }, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}
    </div>
  );
}
