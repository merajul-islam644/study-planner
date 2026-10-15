import { useMemo, useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/toast";
import { sessions, subjects as subjectEntity, tasks } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { addDays, addMonths, startOfWeek, todayISO, toISODate, WEEKDAY_NAMES } from "../../lib/format";
import { colourValue } from "../subjects/colours";
import { SessionFormModal } from "../sessions/SessionFormModal";
import { sessionsForCalendarRange } from "../sessions/useSessions";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";
import { WeekGrid } from "./WeekGrid";
import { MonthGrid } from "./MonthGrid";
import { usePlannerActions } from "./usePlannerActions";
import type { StudySession } from "../data/types";

type View = "Day" | "Week" | "Month";

// No date helper on sessionsForRange is imported directly -- the planner uses
// it for the month/day panel below.
function sessionsOnDate(list: StudySession[], iso: string): StudySession[] {
  return list.filter((session) => session.date?.slice(0, 10) === iso).sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
}

export function PlannerPage() {
  const params = new URLSearchParams(window.location.search);
  const [view, setView] = useState<View>("Week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => params.get("date") ?? todayISO());
  const [dragSubject, setDragSubject] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudySession | null>(null);
  const [deleting, setDeleting] = useState<StudySession | null>(null);

  const list = sessions.useList();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const subjectsQuery = subjectEntity.useList();
  const tasksQuery = tasks.useList();
  const actions = usePlannerActions();
  const { show } = useToast();

  const allSessions = list.data ?? [];
  const weekStart = startOfWeek(anchor);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      return { date, iso: toISODate(date), label: (WEEKDAY_NAMES[index] ?? "").slice(0, 3), isToday: toISODate(date) === todayISO() };
    }),
    [weekStart]
  );

  const tasksDueToday = (tasksQuery.data ?? []).filter((task) => task.dueDate?.slice(0, 10) === todayISO());

  function tickTask(task: import("../data/types").Task) {
    tasks.handle.update(recordId(task), { done: !task.done });
  }

  function sessionsForView(): StudySession[] {
    if (view === "Week") return sessionsForCalendarRange(allSessions, weekStart, addDays(weekStart, 6));
    if (view === "Day") return sessionsOnDate(allSessions, toISODate(anchor));
    return sessionsForCalendarRange(allSessions, new Date(anchor.getFullYear(), anchor.getMonth(), 1), new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
  }

  const rangeLabel = view === "Month"
    ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : view === "Week"
      ? `Week of ${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
      : anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  function shift(direction: number) {
    if (view === "Week") setAnchor((current) => addDays(current, direction * 7));
    else if (view === "Month") setAnchor((current) => addMonths(current, direction));
    else setAnchor((current) => addDays(current, direction));
  }

  const viewSessions = sessionsForView();
  const isEmptyWeek = view === "Week" && sessionsForCalendarRange(allSessions, weekStart, addDays(weekStart, 6)).length === 0;

  return (
    <section>
      <PageHeader
        title="My Planner"
        subtitle="Plan your study blocks, then drag them around to fit your week."
        actions={<button className="primary-button" onClick={() => setEditing({} as StudySession)} disabled={subjectOptions.length === 0}><Plus size={16} /> Add Study Session</button>}
      />

      <div className="planner-toolbar">
        <div className="segmented" role="tablist" aria-label="Planner view">
          {(["Day", "Week", "Month"] as View[]).map((option) => (
            <button key={option} role="tab" aria-selected={view === option} className={view === option ? "active" : ""} onClick={() => setView(option)}>{option}</button>
          ))}
        </div>
        <div className="row">
          <button className="ghost-button" onClick={() => shift(-1)}>‹</button>
          <strong>{rangeLabel}</strong>
          <button className="ghost-button" onClick={() => shift(1)}>›</button>
          <button className="ghost-button" onClick={() => { setAnchor(new Date()); setSelectedDate(todayISO()); }}>Today</button>
        </div>
      </div>

      {subjectOptions.length > 0 && view === "Week" ? (
        <div className="subject-tray" aria-label="Drag a subject onto the grid">
          {subjectOptions.map((subject) => {
            const colour = colourValue(subjectsQuery.data?.find((item) => recordId(item) === subject.id)?.colour);
            return (
              <span
                key={subject.id}
                className="subject-tray-item"
                draggable
                onDragStart={() => setDragSubject(subject.id)}
                onDragEnd={() => setDragSubject(null)}
              >
                <span className="subject-swatch" style={{ background: colour }} />
                {subject.name}
              </span>
            );
          })}
        </div>
      ) : null}

      {list.isLoading ? (
        <Skeleton className="skeleton-block" />
      ) : subjectOptions.length === 0 ? (
        <EmptyState icon={<CalendarDays size={26} />} title="Add a subject first" description="Study sessions belong to a subject. Add a subject to get started." />
      ) : view === "Month" ? (
        <>
          <MonthGrid monthStart={anchor} sessions={viewSessions} subjects={subjectsQuery.data ?? []} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <div className="panel mt16">
            <div className="panel-head"><h3>{(new Date(`${selectedDate}T00:00:00`)).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h3></div>
            <DaySessions list={sessionsOnDate(allSessions, selectedDate)} subjects={subjectsQuery.data ?? []} onOpen={setEditing} />
          </div>
        </>
      ) : view === "Day" ? (
        <div className="panel">
          <DaySessions list={sessionsOnDate(allSessions, toISODate(anchor))} subjects={subjectsQuery.data ?? []} onOpen={setEditing} />
        </div>
      ) : isEmptyWeek ? (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title="Nothing planned this week"
          description="Nothing planned this week. Drag a subject onto the grid or add a study session."
          action={<button className="primary-button" onClick={() => setEditing({} as StudySession)}><Plus size={16} /> Add Study Session</button>}
        />
      ) : (
        <WeekGrid
          days={days}
          sessions={viewSessions}
          subjects={subjectsQuery.data ?? []}
          tasksDueToday={tasksDueToday}
          dragSubject={dragSubject}
          onDragSubjectConsumed={() => setDragSubject(null)}
          onOpenSession={setEditing}
          onTickTask={tickTask}
          onNotify={show}
        />
      )}

      {editing ? (
        <SessionFormModal
          initial={editing.ItemId || editing.itemId ? editing : undefined}
          subjects={subjectOptions}
          topics={topicOptions}
          existing={allSessions}
          defaultDate={selectedDate}
          pending={actions.mutations.create.isPending || actions.mutations.update.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (editing.ItemId || editing.itemId) {
              actions.mutations.update.mutate({ id: recordId(editing), ...values }, { onSuccess: () => { setEditing(null); show("Session updated.", "success"); } });
            } else {
              actions.mutations.create.mutate({ ...values, status: "Upcoming", actualMinutes: 0 }, { onSuccess: () => { setEditing(null); show("Study session added.", "success"); } });
            }
          }}
          onDuplicate={() => {
            actions.duplicateSession(editing).then(() => { setEditing(null); show("Session duplicated to the next day.", "success"); });
          }}
          onDelete={() => setDeleting(editing)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete Study Session?"
          message="Delete Study Session? This action cannot be undone."
          onCancel={() => setDeleting(null)}
          onConfirm={() => actions.mutations.remove.mutate({ id: recordId(deleting) }, { onSuccess: () => { setDeleting(null); setEditing(null); show("Session deleted.", "success"); } })}
        />
      ) : null}
    </section>
  );
}

function DaySessions({ list, subjects, onOpen }: { list: StudySession[]; subjects: { ItemId?: string; itemId?: string; name?: string }[]; onOpen: (session: StudySession) => void }) {
  if (list.length === 0) return <p className="muted">No sessions on this day.</p>;
  return (
    <div className="planner-sessions">
      {list.map((session) => (
        <button key={recordId(session)} className="list-row" onClick={() => onOpen(session)}>
          <div className="list-row-main">
            <strong>{subjects.find((subject) => (subject.ItemId ?? subject.itemId) === session.subjectId)?.name ?? "Subject"}</strong>
            <span className="muted">{session.startTime} · {session.durationMinutes} min · {session.studyType}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
