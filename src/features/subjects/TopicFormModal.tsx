import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { Alert } from "../../shared/ui/Alert";
import type { Difficulty, Topic, TopicStatus } from "../data/types";

const STATUSES: TopicStatus[] = ["Not Started", "Learning", "Reviewed", "Confident"];
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export type TopicFormValues = { name: string; status: TopicStatus; difficulty: Difficulty | ""; notes: string };

export function TopicFormModal({
  initial,
  onClose,
  onSubmit,
  pending,
  error
}: {
  initial?: Topic;
  onClose: () => void;
  onSubmit: (values: TopicFormValues) => void;
  pending: boolean;
  error?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<TopicStatus>(initial?.status ?? "Not Started");
  const [difficulty, setDifficulty] = useState<Difficulty | "">(initial?.difficulty ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [localError, setLocalError] = useState("");

  return (
    <Modal title={initial ? "Edit topic" : "Add topic"} onClose={onClose} dirty={!initial && Boolean(name.trim() || notes.trim())}>
      <div className="field-grid">
        <label className="form-field field-span">
          <span>Name</span>
          <input value={name} onChange={(event) => { setName(event.target.value); setLocalError(""); }} placeholder="Derivatives" />
        </label>
        <div className="form-field">
          <span>Status</span>
          <div className="choice-row" role="radiogroup" aria-label="Topic status">
            {STATUSES.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={status === option} className={`choice ${status === option ? "selected" : ""}`} onClick={() => setStatus(option)}>{option}</button>
            ))}
          </div>
        </div>
        <div className="form-field">
          <span>Difficulty (optional)</span>
          <div className="choice-row" role="radiogroup" aria-label="Topic difficulty">
            {DIFFICULTIES.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={difficulty === option} className={`choice ${difficulty === option ? "selected" : ""}`} onClick={() => setDifficulty(difficulty === option ? "" : option)}>{option}</button>
            ))}
          </div>
        </div>
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
            if (!name.trim()) { setLocalError("Name is required."); return; }
            onSubmit({ name: name.trim(), status, difficulty, notes: notes.trim() });
          }}
        >
          {pending ? "Saving…" : "Save topic"}
        </button>
      </div>
    </Modal>
  );
}
