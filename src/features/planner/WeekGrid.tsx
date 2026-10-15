import { useState } from "react";
import { colourValue } from "../subjects/colours";
import { formatClock12 } from "../../lib/format";
import { usePlannerActions } from "./usePlannerActions";
import type { StudySession, Subject, Task } from "../data/types";

const START_HOUR = 6;
const END_HOUR = 23;
const HOUR_HEIGHT = 44;
const ROWS = END_HOUR - START_HOUR + 1;

type DayColumn = { date: Date; iso: string; label: string; isToday: boolean };

export function WeekGrid({
  days,
  sessions,
  subjects,
  tasksDueToday,
  dragSubject,
  onDragSubjectConsumed,
  onOpenSession,
  onTickTask,
  onNotify
}: {
  days: DayColumn[];
  sessions: StudySession[];
  subjects: Subject[];
  tasksDueToday: Task[];
  dragSubject: string | null;
  onDragSubjectConsumed: () => void;
  onOpenSession: (session: StudySession) => void;
  onTickTask: (task: Task) => void;
  onNotify: (message: string, tone?: "info" | "success" | "error") => void;
}) {
  const actions = usePlannerActions();
  const [dragSession, setDragSession] = useState<StudySession | null>(null);
  const [overCell, setOverCell] = useState<string | null>(null);

  const hours = Array.from({ length: ROWS }, (_, index) => START_HOUR + index);

  function minuteOffset(time: string): number {
    const [hour = 0, minute = 0] = time.split(":").map(Number);
    return (hour - START_HOUR) * HOUR_HEIGHT + (minute / 60) * HOUR_HEIGHT;
  }

  async function handleDrop(iso: string, hour: number, minute: number) {
    const startTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    setOverCell(null);
    if (dragSession) {
      const result = await actions.moveSession(sessions, dragSession, iso, startTime);
      if (result.ok) onNotify(`Moved to ${dayName(iso)} ${formatClock12(startTime)}.`, "success");
      else onNotify(`That time overlaps ${result.conflict}.`, "error");
    } else if (dragSubject) {
      await actions.createAt(dragSubject, iso, startTime);
      onNotify(`Added a session at ${formatClock12(startTime)}.`, "success");
      onDragSubjectConsumed();
    }
    setDragSession(null);
  }

  function colourFor(session: StudySession): string {
    const match = subjects.find((entry) => (entry.ItemId ?? entry.itemId) === session.subjectId);
    return colourValue(match?.colour);
  }

  function subjectNameFor(session: StudySession): string {
    return subjects.find((entry) => (entry.ItemId ?? entry.itemId) === session.subjectId)?.name ?? "";
  }

  return (
    <div className="planner-grid">
      <div className="planner-corner" />
      {days.map((day) => (
        <div key={day.iso} className={`planner-day-head ${day.isToday ? "today" : ""}`}>
          <div>{day.label}</div>
          <div className="muted">{day.date.getDate()}</div>
        </div>
      ))}

      {hours.map((hour) => (
        <FragmentRow
          key={hour}
          hour={hour}
          days={days}
          sessions={sessions}
          tasksDueToday={tasksDueToday}
          minuteOffset={minuteOffset}
          colourFor={colourFor}
          subjectNameFor={subjectNameFor}
          overCell={overCell}
          setOverCell={setOverCell}
          onDrop={handleDrop}
          onOpenSession={onOpenSession}
          onTickTask={onTickTask}
          onDragSession={setDragSession}
          onResize={async (session, minutes) => {
            const result = await actions.resizeSession(sessions, session, minutes);
            if (!result.ok) onNotify(`That time overlaps ${result.conflict}.`, "error");
          }}
        />
      ))}
    </div>
  );
}

function FragmentRow({
  hour,
  days,
  sessions,
  tasksDueToday,
  minuteOffset,
  colourFor,
  subjectNameFor,
  overCell,
  setOverCell,
  onDrop,
  onOpenSession,
  onTickTask,
  onDragSession,
  onResize
}: {
  hour: number;
  days: DayColumn[];
  sessions: StudySession[];
  tasksDueToday: Task[];
  minuteOffset: (time: string) => number;
  colourFor: (session: StudySession) => string;
  subjectNameFor: (session: StudySession) => string;
  overCell: string | null;
  setOverCell: (value: string | null) => void;
  onDrop: (iso: string, hour: number, minute: number) => void;
  onOpenSession: (session: StudySession) => void;
  onTickTask: (task: Task) => void;
  onDragSession: (session: StudySession | null) => void;
  onResize: (session: StudySession, minutes: number) => void;
}) {
  return (
    <>
      <div className="planner-hour">{formatClock12(`${String(hour).padStart(2, "0")}:00`)}</div>
      {days.map((day) => {
        const cellKey = `${day.iso}-${hour}`;
        const inCell = sessions.filter((session) => {
          if (session.date?.slice(0, 10) !== day.iso) return false;
          const [sh] = (session.startTime ?? "00:00").split(":").map(Number);
          return sh === hour;
        });
        const tasks = hour === 6 && day.isToday ? tasksDueToday : [];
        return (
          <div
            key={cellKey}
            className={`planner-cell ${day.isToday ? "today" : ""} ${overCell === cellKey ? "drag-over" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setOverCell(cellKey); }}
            onDragLeave={() => { if (overCell === cellKey) setOverCell(null); }}
            onDrop={(event) => { event.preventDefault(); onDrop(day.iso, hour, 0); }}
          >
            {inCell.map((session) => (
              <PlannerBlock
                key={session.ItemId ?? session.itemId}
                session={session}
                top={minuteOffset(session.startTime ?? "00:00") - minuteOffset(`${String(hour).padStart(2, "0")}:00`)}
                colour={colourFor(session)}
                subjectName={subjectNameFor(session)}
                onOpen={() => onOpenSession(session)}
                onDragStart={() => onDragSession(session)}
                onResize={(minutes) => onResize(session, minutes)}
                draggable
              />
            ))}
            {tasks.map((task) => (
              <label key={task.ItemId ?? task.itemId} className="planner-task" title={task.title}>
                <input type="checkbox" checked={Boolean(task.done)} onChange={() => onTickTask(task)} />
                <span>{task.title}</span>
              </label>
            ))}
          </div>
        );
      })}
    </>
  );
}

export function PlannerBlock({
  session,
  top,
  colour,
  subjectName,
  onOpen,
  onDragStart,
  onResize,
  draggable = false
}: {
  session: StudySession;
  top: number;
  colour: string;
  subjectName?: string;
  onOpen: () => void;
  onDragStart: () => void;
  onResize: (minutes: number) => void;
  draggable?: boolean;
}) {
  const duration = session.durationMinutes ?? 60;
  const height = Math.max(18, (duration / 60) * HOUR_HEIGHT - 2);
  const [resizing, setResizing] = useState(false);

  return (
    <div
      className={`planner-block ${resizing ? "selected" : ""}`}
      style={{ top, height, background: `color-mix(in srgb, ${colour} 22%, hsl(var(--card)))`, borderLeftColor: colour }}
      draggable={draggable}
      onDragStart={(event) => { onDragStart(); event.dataTransfer.effectAllowed = "move"; }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter") onOpen(); }}
    >
      <span className="planner-block-time">{formatClock12(session.startTime)}</span>
      <span>{subjectName || session.studyType}</span>
      <div
        className="planner-resize"
        onMouseDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          const startY = event.clientY;
          const startDuration = duration;
          setResizing(true);
          function onMove(moveEvent: MouseEvent) {
            const deltaHours = (moveEvent.clientY - startY) / HOUR_HEIGHT;
            const next = Math.max(30, Math.round((startDuration + deltaHours * 60) / 30) * 30);
            if (next !== startDuration) onResize(next);
          }
          function onUp() {
            setResizing(false);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          }
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />
    </div>
  );
}

function dayName(iso: string): string {
  const [year = 2026, month = 1, day = 1] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "long" });
}
