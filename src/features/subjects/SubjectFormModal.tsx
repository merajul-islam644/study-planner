import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { Alert } from "../../shared/ui/Alert";
import { colourValue } from "./colours";
import { SUBJECT_COLOURS } from "./colours";
import type { Subject } from "../data/types";

export type SubjectFormValues = { name: string; code: string; colour: string; instructor: string; description: string };

export function SubjectFormModal({
  initial,
  onClose,
  onSubmit,
  existingNames,
  pending,
  error
}: {
  initial?: Subject;
  onClose: () => void;
  onSubmit: (values: SubjectFormValues) => void;
  existingNames: string[];
  pending: boolean;
  error?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [colour, setColour] = useState(initial?.colour ?? SUBJECT_COLOURS[0]);
  const [instructor, setInstructor] = useState(initial?.instructor ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [localError, setLocalError] = useState("");

  const duplicate = existingNames.some((existing) => existing.trim().toLowerCase() === name.trim().toLowerCase() && name.trim() !== "");

  function submit() {
    if (!name.trim()) {
      setLocalError("Name is required.");
      return;
    }
    if (duplicate) {
      setLocalError(`You already have a subject called ${name.trim()}.`);
      return;
    }
    if (!code.trim()) {
      setLocalError("A short code is required.");
      return;
    }
    if (code.trim().length > 8) {
      setLocalError("Short code must be 8 characters or fewer.");
      return;
    }
    onSubmit({ name: name.trim(), code: code.trim().toUpperCase(), colour, instructor: instructor.trim(), description: description.trim() });
  }

  return (
    <Modal title={initial ? "Edit subject" : "Add subject"} onClose={onClose} dirty={!initial && Boolean(name.trim() || code.trim() || instructor.trim() || description.trim())}>
      <div className="field-grid">
        <label className="form-field">
          <span>Name</span>
          <input value={name} onChange={(event) => { setName(event.target.value); setLocalError(""); }} placeholder="Mathematics" />
        </label>
        <label className="form-field">
          <span>Short code</span>
          <input value={code} maxLength={8} onChange={(event) => { setCode(event.target.value.toUpperCase()); setLocalError(""); }} placeholder="MATH" />
        </label>
        <div className="form-field field-span">
          <span>Colour</span>
          <div className="choice-row" role="radiogroup" aria-label="Subject colour">
            {SUBJECT_COLOURS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={colour === option}
                aria-label={option}
                title={option}
                className={`colour-choice ${colour === option ? "selected" : ""}`}
                style={{ background: colourValue(option) }}
                onClick={() => setColour(option)}
              />
            ))}
          </div>
        </div>
        <label className="form-field">
          <span>Instructor (optional)</span>
          <input value={instructor} onChange={(event) => setInstructor(event.target.value)} placeholder="Dr. Rao" />
        </label>
        <label className="form-field field-span">
          <span>Description (optional)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </div>

      {localError ? <div className="field-error">{localError}</div> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" disabled={pending} onClick={submit}>{pending ? "Saving…" : "Save subject"}</button>
      </div>
    </Modal>
  );
}
