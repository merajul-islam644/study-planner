import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/toast";
import { calendarEvents } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { addDays, addMonths, formatClock12, startOfWeek, todayISO, toISODate, WEEKDAY_NAMES } from "../../lib/format";
import { useCalendarItems } from "./useCalendarItems";
import type { CalendarItem } from "./useCalendarItems";
import { PersonalEventModal } from "./PersonalEventModal";
import type { CalendarEvent } from "../data/types";

type View = "Day" | "Week" | "Month";
const VIEW_KEY = "study-planner:calendar-view";

export function CalendarPage() {
  const navigate = useNavigate();
  const calendar = useCalendarItems();
  const rawEvents = calendarEvents.useList();
  const eventMutations = calendarEvents.useMutations();
  const { show } = useToast();

  const [view, setView] = useState<View>(() => (localStorage.getItem(VIEW_KEY) as View) || "Month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayISO());
  const [creating, setCreating] = useState<string | null>(null);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [removing, setRemoving] = useState<CalendarEvent | null>(null);

  function changeView(next: View) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  const itemsForDate = (iso: string) => calendar.items.filter((item) => item.date === iso);

  function openItem(item: CalendarItem) {
    if (item.kind === "Personal event") {
      const record = (rawEvents.data ?? []).find((event) => `p-${recordId(event)}` === item.id);
      if (record) setEditing(record);
      return;
    }
    if (item.linkPath) navigate(item.linkPath);
  }

  const monthCells = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [anchor]);

  const weekStart = startOfWeek(anchor);
  const rangeLabel = view === "Month"
    ? anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : view === "Week"
      ? `Week of ${weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
      : anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  function shift(direction: number) {
    if (view === "Month") setAnchor((current) => addMonths(current, direction));
    else if (view === "Week") setAnchor((current) => addDays(current, direction * 7));
    else setAnchor((current) => addDays(current, direction));
  }

  return (
    <section>
      <PageHeader
        title="Calendar"
        subtitle="Study sessions, assignments, exams, personal events and goal deadlines in one place."
        actions={<button className="primary-button" onClick={() => setCreating(selectedDate)}><Plus size={16} /> Add personal event</button>}
      />

      <div className="planner-toolbar">
        <div className="segmented" role="tablist" aria-label="Calendar view">
          {(["Day", "Week", "Month"] as View[]).map((option) => (
            <button key={option} role="tab" aria-selected={view === option} className={view === option ? "active" : ""} onClick={() => changeView(option)}>{option}</button>
          ))}
        </div>
        <div className="row">
          <button className="ghost-button" onClick={() => shift(-1)}>‹</button>
          <strong>{rangeLabel}</strong>
          <button className="ghost-button" onClick={() => shift(1)}>›</button>
          <button className="ghost-button" onClick={() => { setAnchor(new Date()); setSelectedDate(todayISO()); }}>Today</button>
        </div>
      </div>

      <div className="row wrap mb0" style={{ gap: 14 }}>
        <Legend className="event-blue" word="Study session" />
        <Legend className="event-amber" word="Assignment" />
        <Legend className="event-red" word="Exam" />
        <Legend className="event-grey" word="Personal event" />
        <Legend className="event-green" word="Goal deadline" />
      </div>

      {calendar.isLoading ? <Skeleton className="skeleton-block mt8" /> : view === "Month" ? (
        <>
          <div className="month-grid mt8">
            {monthCells.map((date) => {
              const iso = toISODate(date);
              const inMonth = date.getMonth() === anchor.getMonth();
              const dayItems = itemsForDate(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`month-cell ${iso === calendar.today ? "today" : ""} ${iso === selectedDate ? "selected" : ""}`}
                  style={{ opacity: inMonth ? 1 : 0.45 }}
                  onClick={() => setSelectedDate(iso)}
                >
                  <span className="month-day-num">{date.getDate()}</span>
                  <div className="month-dots">
                    {dayItems.slice(0, 5).map((item) => <span key={item.id} className={`month-dot ${item.colourClass}`} />)}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="panel mt16">
            <div className="panel-head">
              <h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h3>
              <button className="ghost-button" onClick={() => setCreating(selectedDate)}><Plus size={15} /> Add personal event</button>
            </div>
            <DayList items={itemsForDate(selectedDate)} onOpen={openItem} />
          </div>
        </>
      ) : view === "Week" ? (
        <div className="panel">
          {Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map((date) => {
            const iso = toISODate(date);
            const dayItems = itemsForDate(iso);
            return (
              <div key={iso} className="mt8">
                <h3>{WEEKDAY_NAMES[(date.getDay() + 6) % 7]} · {date.getDate()}</h3>
                <DayList items={dayItems} onOpen={openItem} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel">
          <h3>{anchor.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</h3>
          <DayList items={itemsForDate(toISODate(anchor))} onOpen={openItem} />
        </div>
      )}

      {creating ? (
        <PersonalEventModal
          defaultDate={creating}
          pending={eventMutations.create.isPending}
          onClose={() => setCreating(null)}
          onSubmit={(values) => eventMutations.create.mutate(values, { onSuccess: () => { setCreating(null); show("Personal event added.", "success"); } })}
        />
      ) : null}

      {editing ? (
        <PersonalEventModal
          initial={editing}
          pending={eventMutations.update.isPending}
          onClose={() => setEditing(null)}
          onDelete={() => { setRemoving(editing); setEditing(null); }}
          onSubmit={(values) => eventMutations.update.mutate({ id: recordId(editing), ...values }, { onSuccess: () => { setEditing(null); show("Event updated.", "success"); } })}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Delete personal event"
          message="Delete this personal event? This action cannot be undone."
          onCancel={() => setRemoving(null)}
          onConfirm={() => eventMutations.remove.mutate({ id: recordId(removing) }, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}
    </section>
  );
}

function DayList({ items, onOpen }: { items: CalendarItem[]; onOpen: (item: CalendarItem) => void }) {
  if (items.length === 0) return <p className="muted">Nothing on this day.</p>;
  return (
    <div className="calendar-list">
      {items.map((item) => (
        <button key={item.id} className="calendar-entry result-row" onClick={() => onOpen(item)}>
          <span className="event-type"><span className={`event-dot ${item.colourClass}`} /> {item.kind}</span>
          <span className="grow">{item.title}{item.time ? ` · ${formatClock12(item.time)}` : ""}</span>
        </button>
      ))}
    </div>
  );
}

function Legend({ className, word }: { className: string; word: string }) {
  return <span className="event-type"><span className={`event-dot ${className}`} /> {word}</span>;
}
