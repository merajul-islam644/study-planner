import { useState } from "react";
import { formatDuration } from "../../lib/format";

export type ChartMeasure = "Study Hours" | "Completed Tasks" | "Sessions" | "Weekly Goal";

// The weekly chart draws Monday to Sunday for the chosen measure, with the
// week's total above it and a text summary for screen readers so the figures
// are never carried by the bars alone.
export function WeeklyChart({
  days,
  onMeasure
}: {
  days: { day: string; minutes: number; tasks: number; sessions: number }[];
  onMeasure?: (measure: ChartMeasure) => void;
}) {
  const [measure, setMeasure] = useState<ChartMeasure>("Study Hours");
  const [weeklyGoalMinutes] = useState(14 * 60);

  const values = days.map((entry) => {
    switch (measure) {
      case "Completed Tasks":
        return entry.tasks;
      case "Sessions":
        return entry.sessions;
      case "Weekly Goal":
        return entry.minutes;
      default:
        return entry.minutes;
    }
  });

  const max = Math.max(1, ...values, measure === "Weekly Goal" ? weeklyGoalMinutes / 7 : 0);
  const total = values.reduce((sum, value) => sum + value, 0);

  function labelFor(entry: { day: string; minutes: number; tasks: number; sessions: number }): string {
    if (measure === "Completed Tasks") return entry.tasks === 0 ? "No tasks completed" : `${entry.tasks} tasks`;
    if (measure === "Sessions") return entry.sessions === 0 ? "No sessions" : `${entry.sessions} sessions`;
    return entry.minutes === 0 ? "No study logged" : formatDuration(entry.minutes);
  }

  const summary = days.map((entry, index) => {
    if (measure === "Study Hours" || measure === "Weekly Goal") {
      return `${WEEKDAY_LONG[index]} ${entry.minutes === 0 ? "0h 00m, No study logged" : formatDuration(entry.minutes)}`;
    }
    return `${WEEKDAY_LONG[index]} ${values[index]} ${measure === "Completed Tasks" ? "tasks" : "sessions"}`;
  }).join(", ");

  return (
    <div className="chart">
      <div className="panel-head">
        <div>
          <h3>{measure === "Weekly Goal" ? "Weekly goal" : measure}</h3>
          <p className="muted">This week: {measure === "Study Hours" || measure === "Weekly Goal" ? formatDuration(total) : `${total} ${measure === "Completed Tasks" ? "tasks" : "sessions"}`}</p>
        </div>
        <div className="range-tabs" role="tablist" aria-label="Chart measure">
          {(["Study Hours", "Completed Tasks", "Sessions", "Weekly Goal"] as ChartMeasure[]).map((option) => (
            <button
              key={option}
              role="tab"
              aria-selected={measure === option}
              className={`filter-chip ${measure === option ? "active" : ""}`}
              onClick={() => { setMeasure(option); onMeasure?.(option); }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-bars" role="img" tabIndex={0} aria-label={`Weekly chart, ${measure}. ${summary}`}>
        {days.map((entry, index) => {
          const value = values[index] ?? 0;
          const height = Math.round((value / max) * 100);
          return (
            <div key={entry.day} className="chart-bar-col">
              <div className="chart-bar-track">
                <div className={`chart-bar ${value === 0 ? "empty" : ""}`} style={{ height: `${Math.max(value === 0 ? 3 : 8, height)}%` }} />
              </div>
              <span className="chart-label">{entry.day}</span>
              <span className="chart-value">{labelFor(entry)}</span>
            </div>
          );
        })}
      </div>
      <p className="chart-summary">{summary}</p>
    </div>
  );
}

const WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
