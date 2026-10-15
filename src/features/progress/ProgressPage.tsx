import { useMemo, useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ProgressBar } from "../../shared/ui/indicators";
import { sessions, assignments, exams, topics, subjects } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { addDays, formatDuration, percent, startOfWeek, todayISO, toISODate } from "../../lib/format";
import { colourValue } from "../subjects/colours";
import { computeStreak, sessionMinutes } from "../sessions/useSessions";
import { effectiveStatus } from "../assignments/useAssignments";
import { preparationProgress } from "../exams/useExams";

type Period = "7 Days" | "30 Days" | "3 Months" | "6 Months" | "1 Year";
const PERIODS: Period[] = ["7 Days", "30 Days", "3 Months", "6 Months", "1 Year"];

const PERIOD_DAYS: Record<Period, number> = { "7 Days": 7, "30 Days": 30, "3 Months": 90, "6 Months": 180, "1 Year": 365 };

export function ProgressPage() {
  const navigate = useNavigate();
  const sessionsList = sessions.useList();
  const assignmentsList = assignments.useList();
  const examsList = exams.useList();
  const topicsList = topics.useList();
  const subjectsList = subjects.useList();
  const [period, setPeriod] = useState<Period>("30 Days");

  const allSessions = sessionsList.data ?? [];

  const model = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const from = toISODate(addDays(new Date(), -(days - 1)));
    const inRange = allSessions.filter((session) => (session.date?.slice(0, 10) ?? "") >= from);

    const totalMinutes = inRange.reduce((total, session) => total + sessionMinutes(session), 0);

    const weekStart = startOfWeek(new Date());
    const weekMinutes = allSessions
      .filter((session) => (session.date?.slice(0, 10) ?? "") >= toISODate(weekStart))
      .reduce((total, session) => total + sessionMinutes(session), 0);
    const weeklyAverage = Math.round(weekMinutes);

    const completedAssignments = (assignmentsList.data ?? []).filter((assignment) => effectiveStatus(assignment) === "Completed").length;
    const completionRate = percent(completedAssignments, (assignmentsList.data ?? []).length);

    // Distinct days with logged study.
    const studyDays = new Set(inRange.map((session) => session.date?.slice(0, 10)));

    const byDay: { day: string; minutes: number }[] = [];
    const span = Math.min(days, 14);
    for (let index = span - 1; index >= 0; index -= 1) {
      const date = addDays(new Date(), -index);
      const iso = toISODate(date);
      byDay.push({ day: date.toLocaleDateString(undefined, { weekday: "short" }), minutes: allSessions.filter((session) => session.date?.slice(0, 10) === iso).reduce((total, session) => total + sessionMinutes(session), 0) });
    }

    const bySubject = (subjectsList.data ?? []).map((subject) => {
      const id = recordId(subject);
      const minutes = inRange.filter((session) => session.subjectId === id).reduce((total, session) => total + sessionMinutes(session), 0);
      return { name: subject.name ?? "Subject", colour: colourValue(subject.colour), minutes };
    }).filter((entry) => entry.minutes > 0).sort((a, b) => b.minutes - a.minutes);

    const confidentTopics = (topicsList.data ?? []).filter((topic) => topic.status === "Confident" || topic.status === "Reviewed").length;
    const topicCompletion = percent(confidentTopics, (topicsList.data ?? []).length);

    const upcomingExam = (examsList.data ?? []).slice().sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""))[0];
    const examPrep = upcomingExam ? preparationProgress(upcomingExam, topicsList.data ?? []).percent : 0;

    return {
      totalMinutes,
      weeklyAverage,
      completionRate,
      streak: computeStreak(allSessions),
      byDay,
      bySubject,
      topicCompletion,
      examPrep,
      hasEnoughHistory: studyDays.size >= 2
    };
  }, [allSessions, assignmentsList.data, examsList.data, topicsList.data, subjectsList.data, period]);

  const maxDay = Math.max(1, ...model.byDay.map((entry) => entry.minutes));
  const maxSubject = Math.max(1, ...model.bySubject.map((entry) => entry.minutes));

  return (
    <section>
      <PageHeader
        title="Progress"
        subtitle="How your study is going over time."
        actions={
          <div className="range-tabs" role="tablist" aria-label="Period">
            {PERIODS.map((option) => (
              <button key={option} role="tab" aria-selected={period === option} className={`filter-chip ${period === option ? "active" : ""}`} onClick={() => setPeriod(option)}>{option}</button>
            ))}
          </div>
        }
      />

      <div className="metrics">
        <div className="metric"><span>Total study time</span><strong>{formatDuration(model.totalMinutes)}</strong><small className="muted">{period}</small></div>
        <div className="metric"><span>Weekly average</span><strong>{formatDuration(model.weeklyAverage)}</strong><small className="muted">This week</small></div>
        <div className="metric"><span>Completion rate</span><strong>{model.completionRate}%</strong><small className="muted">This month</small></div>
        <div className="metric"><span>Current streak</span><strong>{model.streak} {model.streak === 1 ? "day" : "days"}</strong></div>
      </div>

      {!model.hasEnoughHistory ? (
        <EmptyState title="Not enough history yet" description="Your charts appear after two days of study. Log a session to get started." action={<button className="primary-button" onClick={() => navigate("/sessions")}>Log a session</button>} />
      ) : (
        <>
          <div className="panel">
            <div className="panel-head"><h3>Hours by day</h3><span className="muted">{period}</span></div>
            <div className="chart-bars" role="img" tabIndex={0} aria-label={`Study time by day for ${period}. ${model.byDay.map((entry) => `${entry.day} ${formatDuration(entry.minutes)}`).join(", ")}`}>
              {model.byDay.map((entry, index) => (
                <div key={`${entry.day}-${index}`} className="chart-bar-col">
                  <div className="chart-bar-track"><div className={`chart-bar ${entry.minutes === 0 ? "empty" : ""}`} style={{ height: `${Math.max(entry.minutes === 0 ? 3 : 8, Math.round((entry.minutes / maxDay) * 100))}%` }} /></div>
                  <span className="chart-label">{entry.day}</span>
                  <span className="chart-value">{entry.minutes === 0 ? "0h 00m" : formatDuration(entry.minutes)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Hours by subject</h3><span className="muted">{period}</span></div>
            {model.bySubject.length === 0 ? <p className="muted">No study logged in this period yet.</p> : (
              <div className="list-stack">
                {model.bySubject.map((entry) => (
                  <div key={entry.name}>
                    <div className="row-between"><span>{entry.name}</span><strong>{formatDuration(entry.minutes)}</strong></div>
                    <div className="progress-bar"><span style={{ width: `${Math.round((entry.minutes / maxSubject) * 100)}%`, background: entry.colour }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid">
            <div className="panel mb0"><div className="panel-title">Assignment completion</div><strong style={{ fontSize: 26 }}>{model.completionRate}%</strong><span className="muted">This month</span></div>
            <div className="panel mb0"><div className="panel-title">Topic completion</div><strong style={{ fontSize: 26 }}>{model.topicCompletion}%</strong><span className="muted">Reviewed or confident</span></div>
            <div className="panel mb0"><div className="panel-title">Next exam preparation</div><strong style={{ fontSize: 26 }}>{model.examPrep}%</strong><ProgressBar ratio={model.examPrep / 100} label="Next exam preparation" /></div>
          </div>
        </>
      )}
    </section>
  );
}
