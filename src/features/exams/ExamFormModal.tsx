import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { Alert } from "../../shared/ui/Alert";
import type { Exam } from "../data/types";

export type ExamFormValues = { name: string; subjectId: string; date: string; time: string; location: string; topicIds: string[]; notes: string };

export function ExamFormModal({
  initial,
  subjects,
  topics,
  defaultSubjectId,
  onClose,
  onSubmit,
  pending,
  error
}: {
  initial?: Exam;
  subjects: { id: string; name: string }[];
  topics: { id: string; name: string; subjectId?: string }[];
  defaultSubjectId?: string;
  onClose: () => void;
  onSubmit: (values: ExamFormValues) => void;
  pending: boolean;
  error?: string;
}) {
  const initialDate = initial?.dateTime ? new Date(initial.dateTime) : undefined;
  const [name, setName] = useState(initial?.name ?? "");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [date, setDate] = useState(initialDate && !Number.isNaN(initialDate.getTime()) ? initialDate.toISOString().slice(0, 10) : "");
  const [time, setTime] = useState(initialDate && !Number.isNaN(initialDate.getTime()) ? initialDate.toTimeString().slice(0, 5) : "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [topicIds, setTopicIds] = useState<string[]>(initial?.topicIds ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [localError, setLocalError] = useState("");

  const subjectTopics = topics.filter((topic) => topic.subjectId === subjectId);

  return (
    <Modal title={initial ? "Edit exam" : "Add exam"} onClose={onClose} dirty={!initial && Boolean(name.trim() || location.trim() || notes.trim())}>
      <div className="field-grid">
        <label className="form-field field-span">
          <span>Name</span>
          <input value={name} onChange={(event) => { setName(event.target.value); setLocalError(""); }} placeholder="Mathematics Midterm" />
        </label>
        <label className="form-field">
          <span>Subject</span>
          <select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicIds([]); }}>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Location (optional)</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Hall B" />
        </label>
        <label className="form-field">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setLocalError(""); }} />
        </label>
        <label className="form-field">
          <span>Time</span>
          <input type="time" value={time} onChange={(event) => { setTime(event.target.value); setLocalError(""); }} />
        </label>
        <div className="form-field field-span">
          <span>Topics covered</span>
          {subjectTopics.length === 0 ? (
            <p className="helper-text">No topics for this subject yet.</p>
          ) : (
            <div className="choice-row">
              {subjectTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={topicIds.includes(topic.id)}
                  className={`choice ${topicIds.includes(topic.id) ? "selected" : ""}`}
                  onClick={() => setTopicIds((current) => current.includes(topic.id) ? current.filter((id) => id !== topic.id) : [...current, topic.id])}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          )}
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
            if (!date || !time) { setLocalError("Date and time are required."); return; }
            onSubmit({ name: name.trim(), subjectId, date, time, location: location.trim(), topicIds, notes: notes.trim() });
          }}
        >
          {pending ? "Saving…" : "Save exam"}
        </button>
      </div>
    </Modal>
  );
}
