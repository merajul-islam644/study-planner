import { useMemo } from "react";
import { toISODate } from "../../lib/format";
import { colourValue } from "../subjects/colours";
import type { StudySession, Subject } from "../data/types";

export function MonthGrid({
  monthStart,
  sessions,
  subjects,
  selectedDate,
  onSelectDate
}: {
  monthStart: Date;
  sessions: StudySession[];
  subjects: Subject[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}) {
  const cells = useMemo(() => {
    const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [monthStart]);

  const today = toISODate(new Date());

  function colourFor(session: StudySession): string {
    const match = subjects.find((entry) => (entry.ItemId ?? entry.itemId) === session.subjectId);
    return colourValue(match?.colour);
  }

  return (
    <>
      <div className="month-grid">
        {cells.map((date) => {
          const iso = toISODate(date);
          const inMonth = date.getMonth() === monthStart.getMonth();
          const daySessions = sessions.filter((session) => session.date?.slice(0, 10) === iso);
          return (
            <button
              key={iso}
              type="button"
              className={`month-cell ${iso === today ? "today" : ""} ${iso === selectedDate ? "selected" : ""}`}
              style={{ opacity: inMonth ? 1 : 0.45 }}
              onClick={() => onSelectDate(iso)}
            >
              <span className="month-day-num">{date.getDate()}</span>
              <div className="month-dots">
                {daySessions.slice(0, 4).map((session) => (
                  <span key={session.ItemId ?? session.itemId} className="month-dot" style={{ background: colourFor(session) }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
