import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { Alert } from "../../shared/ui/Alert";
import type { Assignment, AssignmentPriority } from "../data/types";

const PRIORITIES: AssignmentPriority[] = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Not Started", "In Progress", "Completed"] as const;

export type AssignmentFormValues = {
  title: string;
  subjectId: string;
  description: string;
  dueDate: string;
  priority: AssignmentPriority;
  status: string;
  estimatedMinutes: number | null;
  notes: string;
};

export function AssignmentFormModal({
  initial,
  subjects,
  defaultSubjectId,
  onClose,
  onSubmit,
  pending,
  error
}: {
  initial?: Assignment;
  subjects: { id: string; name: string }[];
  defaultSubjectId?: string;
  onClose: () => void;
  onSubmit: (values: AssignmentFormValues) => void;
  pending: boolean;
  error?: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate?.slice(0, 10) ?? "");
  const [priority, setPriority] = useState<AssignmentPriority>(initial?.priority ?? "Medium");
  const [status, setStatus] = useState<string>(initial?.status ?? "Not Started");
  const [estimated, setEstimated] = useState(initial?.estimatedMinutes ? String(initial.estimatedMinutes) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [localError, setLocalError] = useState("");

  return (
    <Modal title={initial ? "Edit assignment" : "Add assignment"} onClose={onClose} dirty={!initial && Boolean(title.trim() || description.trim() || notes.trim() || estimated)}>
      <div className="field-grid">
        <label className="form-field field-span">
          <span>Title</span>
          <input value={title} onChange={(event) => { setTitle(event.target.value); setLocalError(""); }} placeholder="Problem set 3" />
        </label>
        <label className="form-field">
          <span>Subject</span>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Due date</span>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
        <div className="form-field">
          <span>Priority</span>
          <div className="choice-row" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={priority === option} className={`choice ${priority === option ? "selected" : ""}`} onClick={() => setPriority(option)}>{option}</button>
            ))}
          </div>
        </div>
        <label className="form-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Estimated time (minutes)</span>
          <input type="number" min={0} value={estimated} onChange={(event) => setEstimated(event.target.value)} />
        </label>
        <label className="form-field field-span">
          <span>Description (optional)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="form-field field-span">
          <span>Notes (optional)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      {localError ? <div className="field-error">{localError}</div> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button
          className="primary-button"
          disabled={pending}
          onClick={() => {
            if (!title.trim()) { setLocalError("Title is required."); return; }
            if (!subjectId) { setLocalError("Choose a subject."); return; }
            onSubmit({
              title: title.trim(),
              subjectId,
              description: description.trim(),
              dueDate,
              priority,
              status,
              estimatedMinutes: estimated ? Number(estimated) : null,
              notes: notes.trim()
            });
          }}
        >
          {pending ? "Saving…" : "Save assignment"}
        </button>
      </div>
    </Modal>
  );
}
