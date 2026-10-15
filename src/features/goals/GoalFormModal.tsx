import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import type { Goal, GoalType } from "../data/types";

const TYPES: GoalType[] = ["Study hours", "Complete topics", "Assignment score", "Study streak"];

export type GoalFormValues = { title: string; description: string; type: GoalType; target: number; deadline: string };

export function GoalFormModal({
  initial,
  onClose,
  onSubmit,
  pending
}: {
  initial?: Goal;
  onClose: () => void;
  onSubmit: (values: GoalFormValues) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<GoalType>(initial?.type ?? "Study hours");
  const [target, setTarget] = useState(initial?.target ? String(initial.target) : "20");
  const [deadline, setDeadline] = useState(initial?.deadline?.slice(0, 10) ?? "");
  const [error, setError] = useState("");

  return (
    <Modal title={initial ? "Edit goal" : "Add goal"} onClose={onClose} dirty={!initial && Boolean(title.trim() || description.trim() || deadline)}>
      <div className="field-grid">
        <label className="form-field field-span">
          <span>Title</span>
          <input value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="Study 20 hours this month" />
        </label>
        <div className="form-field field-span">
          <span>Type</span>
          <div className="choice-row" role="radiogroup" aria-label="Goal type">
            {TYPES.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={type === option} className={`choice ${type === option ? "selected" : ""}`} onClick={() => setType(option)}>{option}</button>
            ))}
          </div>
        </div>
        <label className="form-field">
          <span>Target {type === "Study hours" ? "(hours)" : type === "Study streak" ? "(days)" : type === "Assignment score" ? "(%)" : "(topics)"}</span>
          <input type="number" min={1} value={target} onChange={(event) => setTarget(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Deadline</span>
          <input type="date" value={deadline} onChange={(event) => { setDeadline(event.target.value); setError(""); }} />
        </label>
        <label className="form-field field-span">
          <span>Description (optional)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </div>
      {error ? <div className="field-error">{error}</div> : null}
      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button
          className="primary-button"
          disabled={pending}
          onClick={() => {
            if (!title.trim()) { setError("Title is required."); return; }
            if (!deadline) { setError("Deadline is required."); return; }
            if (!target || Number(target) <= 0) { setError("Target is required."); return; }
            onSubmit({ title: title.trim(), description: description.trim(), type, target: Number(target), deadline });
          }}
        >
          {pending ? "Saving…" : "Save goal"}
        </button>
      </div>
    </Modal>
  );
}

export function ExtendDeadlineModal({ goal, onClose, onSubmit, pending }: { goal: Goal; onClose: () => void; onSubmit: (deadline: string) => void; pending: boolean }) {
  const [deadline, setDeadline] = useState(goal.deadline?.slice(0, 10) ?? "");
  return (
    <Modal title="Extend deadline" onClose={onClose}>
      <label className="form-field">
        <span>New deadline</span>
        <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
      </label>
      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" disabled={pending} onClick={() => onSubmit(deadline)}>Extend deadline</button>
      </div>
    </Modal>
  );
}
