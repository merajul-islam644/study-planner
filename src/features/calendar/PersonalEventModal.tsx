import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { formatClock12 } from "../../lib/format";
import type { CalendarEvent } from "../data/types";

export function PersonalEventModal({
  initial,
  defaultDate,
  onClose,
  onSubmit,
  onDelete,
  pending
}: {
  initial?: CalendarEvent;
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (values: { title: string; date: string; startTime: string; endTime: string; notes: string }) => void;
  onDelete?: () => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? defaultDate ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  return (
    <Modal title={initial ? "Edit personal event" : "Add personal event"} onClose={onClose} dirty={!initial && Boolean(title.trim() || notes.trim())}>
      <div className="field-grid">
        <label className="form-field field-span">
          <span>Title</span>
          <input value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} placeholder="Library session" />
        </label>
        <label className="form-field">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <span />
        <label className="form-field">
          <span>Start time</span>
          <input type="time" value={startTime} onChange={(event) => { setStartTime(event.target.value); setError(""); }} />
        </label>
        <label className="form-field">
          <span>End time</span>
          <input type="time" value={endTime} onChange={(event) => { setEndTime(event.target.value); setError(""); }} />
        </label>
        <label className="form-field field-span">
          <span>Notes (optional)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      {error ? <div className="field-error">{error}</div> : null}
      <div className="modal-actions">
        {onDelete ? <button className="icon-button" onClick={onDelete}>Delete</button> : null}
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button
          className="primary-button"
          disabled={pending}
          onClick={() => {
            if (!title.trim()) { setError("Title is required."); return; }
            if (!date) { setError("Date is required."); return; }
            if (endTime <= startTime) { setError("End time must be after the start time."); return; }
            onSubmit({ title: title.trim(), date, startTime, endTime, notes: notes.trim() });
          }}
        >
          {pending ? "Saving…" : "Save event"}
        </button>
      </div>
    </Modal>
  );
}

export function eventRangeLabel(start: string | undefined, end: string | undefined): string {
  if (!start) return "";
  return end ? `${formatClock12(start)} – ${formatClock12(end)}` : formatClock12(start);
}
