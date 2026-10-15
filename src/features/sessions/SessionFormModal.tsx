import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { Alert } from "../../shared/ui/Alert";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { formatClock12 } from "../../lib/format";
import { recordId } from "../../lib/blocks/data";
import { findOverlap } from "./useSessions";
import type { StudySession, StudyTypes } from "../data/types";

const STUDY_TYPES: StudyTypes[] = ["Learning", "Revision", "Practice", "Homework", "Exam Preparation"];
const OFFSETS = [5, 15, 30, 60, 1440];

export type SessionFormValues = {
  subjectId: string;
  topicId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  studyType: StudyTypes;
  notes: string;
  reminderOffsetMinutes: number | null;
};

export function SessionFormModal({
  initial,
  subjects,
  topics,
  existing,
  defaultSubjectId,
  defaultDate,
  onClose,
  onSubmit,
  onDuplicate,
  onDelete,
  pending,
  error
}: {
  initial?: StudySession;
  subjects: { id: string; name: string }[];
  topics: { id: string; name: string; subjectId?: string }[];
  existing: StudySession[];
  defaultSubjectId?: string;
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (values: SessionFormValues) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  pending: boolean;
  error?: string;
}) {
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [topicId, setTopicId] = useState(initial?.topicId ?? "");
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? defaultDate ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [duration, setDuration] = useState(initial?.durationMinutes ? String(initial.durationMinutes) : "60");
  const [studyType, setStudyType] = useState<StudyTypes>(initial?.studyType ?? "Learning");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [offset, setOffset] = useState<number | null>(initial?.reminderOffsetMinutes ?? null);
  const [localError, setLocalError] = useState("");
  const [overlap, setOverlap] = useState<StudySession | null>(null);

  const subjectTopics = topics.filter((topic) => topic.subjectId === subjectId);

  function buildValues(): SessionFormValues {
    return { subjectId, topicId, date, startTime, durationMinutes: Number(duration), studyType, notes: notes.trim(), reminderOffsetMinutes: offset };
  }

  function attemptSave(force: boolean) {
    const values = buildValues();
    if (!subjectId) { setLocalError("Choose a subject."); return; }
    if (!date) { setLocalError("Date is required."); return; }
    if (!startTime) { setLocalError("Start time is required."); return; }
    if (!duration || Number(duration) < 5) { setLocalError("Duration must be at least 5 minutes."); return; }
    setLocalError("");

    if (!force) {
      const clash = findOverlap(existing, { date, startTime, durationMinutes: Number(duration), ignoreId: initial ? recordId(initial) : undefined });
      if (clash) {
        setOverlap(clash);
        return;
      }
    }
    onSubmit(values);
  }

  const overlapLabel = overlap
    ? `${subjects.find((subject) => subject.id === overlap.subjectId)?.name ?? "Another session"} ${formatClock12(overlap.startTime)}`
    : "";
  const thisSubject = subjects.find((subject) => subject.id === subjectId)?.name ?? "This session";

  return (
    <Modal title={initial ? "Edit study session" : "Add study session"} onClose={onClose} dirty={!initial && Boolean(notes.trim() || topicId || startTime !== "09:00" || duration !== "60")}>
      <div className="field-grid">
        <label className="form-field">
          <span>Subject</span>
          <select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); }}>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Topic (optional)</span>
          <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
            <option value="">No topic</option>
            {subjectTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Start time</span>
          <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Duration (minutes)</span>
          <input type="number" min={5} value={duration} onChange={(event) => setDuration(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Reminder</span>
          <select value={offset ?? ""} onChange={(event) => setOffset(event.target.value ? Number(event.target.value) : null)}>
            <option value="">No reminder</option>
            {OFFSETS.map((value) => <option key={value} value={value}>{offsetLabel(value)}</option>)}
          </select>
        </label>
        <div className="form-field field-span">
          <span>Study type</span>
          <div className="choice-row" role="radiogroup" aria-label="Study type">
            {STUDY_TYPES.map((type) => (
              <button key={type} type="button" role="radio" aria-checked={studyType === type} className={`choice ${studyType === type ? "selected" : ""}`} onClick={() => setStudyType(type)}>{type}</button>
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
        {onDelete ? <button className="icon-button" onClick={onDelete}>Delete</button> : null}
        {onDuplicate ? <button className="ghost-button" onClick={onDuplicate}>Duplicate</button> : null}
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" disabled={pending} onClick={() => attemptSave(false)}>{pending ? "Saving…" : "Save session"}</button>
      </div>

      {overlap ? (
        <ConfirmDialog
          title="Time overlaps"
          message={`${thisSubject} ${formatClock12(startTime)} overlaps ${overlapLabel}. Save anyway?`}
          confirmLabel="Save anyway"
          tone="primary"
          onCancel={() => setOverlap(null)}
          onConfirm={() => { setOverlap(null); attemptSave(true); }}
        />
      ) : null}
    </Modal>
  );
}

export function offsetLabel(offset: number): string {
  if (offset === 5) return "5 minutes before";
  if (offset === 15) return "15 minutes before";
  if (offset === 30) return "30 minutes before";
  if (offset === 60) return "1 hour before";
  if (offset === 1440) return "1 day before";
  return `${offset} minutes before`;
}

export { STUDY_TYPES };
