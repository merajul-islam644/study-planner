import { useNavigate } from "../../app/router/navigation";
import { useAuth } from "../../app/providers/AuthProvider";
import { greetingKeyForHour, todayLabel } from "./greeting";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Skeleton } from "../../shared/ui/Skeleton";
import { EmptyState } from "../../shared/ui/EmptyState";
import { StatusLabel, ProgressRing, priorityTone, statusTone } from "../../shared/ui/indicators";
import { userDisplayName, useCurrentUser } from "../profile/useCurrentUser";
import { useDashboardData, sessionRowLabel } from "./useDashboardData";
import { WeeklyChart } from "./WeeklyChart";
import { QuickActions } from "./QuickActions";
import { effectiveSessionStatus } from "../sessions/useSessions";
import { examState } from "../exams/useExams";
import { formatDuration, formatDateMedium, daysBetween } from "../../lib/format";

export function DashboardPage() {
  const navigate = useNavigate();
  const { claims } = useAuth();
  const { t } = useT();
  const me = useCurrentUser();
  const dash = useDashboardData();
  const name = userDisplayName(me.data?.data) || firstNameFromClaims(claims) || "there";
  const greeting = t(greetingKeyForHour(new Date().getHours()));

  const targetMet = dash.todayMinutes >= dash.dailyTarget;
  const ratio = dash.dailyTarget > 0 ? dash.todayMinutes / dash.dailyTarget : 0;
  const targetPercent = Math.round(ratio * 100);

  return (
    <section>
      <div className="dashboard-header">
        <PageHeader title={`${greeting}, ${name}`} subtitle={todayLabel()} />
      </div>

      <div className="dashboard-columns">
        <div className="stack">
          <div className="panel">
            <div className="panel-head"><h3>Today's study target</h3></div>
            <div className="target-block">
              <ProgressRing ratio={Math.min(1, ratio)} label={`${Math.min(100, targetPercent)}%`} />
              <div className="target-figures">
                <strong>{formatDuration(dash.todayMinutes)} / {formatDuration(dash.dailyTarget)}</strong>
                <span className="muted">{targetMet ? "Target met" : `${targetPercent}% completed`}</span>
              </div>
            </div>
          </div>

          <div className="metrics">
            <StatCard label="Tasks today" value={String(dash.tasksToday)} sub={`${dash.tasksDone} completed`} />
            <StatCard label="Study time today" value={formatDuration(dash.todayMinutes)} sub={dash.todayMinutes > 0 ? "Keep it up" : "Nothing logged yet"} />
            <ExamStatCard count={dash.upcomingExams.length} next={dash.subjectMap.get(dash.upcomingExams[0]?.subjectId ?? "")} onAdd={() => navigate("/exams")} />
            <StatCard label="Current streak" value={`${dash.streak} ${dash.streak === 1 ? "day" : "days"}`} sub={dash.streak > 0 ? "Keep going!" : "Start a new streak today."} />
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Today's study plan</h3>
              <button className="link-inline" onClick={() => navigate("/planner")}>Open planner</button>
            </div>
            {dash.isLoading ? <Skeleton className="skeleton-line-lg" /> : dash.todaySessions.length === 0 ? (
              <p className="muted">Nothing planned for today. Add a study session to get started.</p>
            ) : (
              <div className="timeline">
                {dash.todaySessions.map((session) => {
                  const status = effectiveSessionStatus(session);
                  return (
                    <div key={session.ItemId ?? session.itemId} className="timeline-row">
                      <span className="timeline-time">{session.startTime}</span>
                      <span className="grow">{sessionRowLabel(session, dash.subjectMap)}</span>
                      <StatusLabel tone={statusTone(status)}>{status}</StatusLabel>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>This week</h3></div>
            {dash.isLoading ? <Skeleton className="skeleton-block" /> : (
              <WeeklyChart days={dash.week.map((entry) => ({ day: entry.day, minutes: entry.minutes, tasks: entry.tasks, sessions: entry.sessions }))} />
            )}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <div className="panel-head"><h3>Upcoming deadlines</h3></div>
            <Deadlines dash={dash} />
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Quick actions</h3></div>
            <QuickActions />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small className="muted">{sub}</small></div>;
}

function ExamStatCard({ count, next, onAdd }: { count: number; next?: string; onAdd: () => void }) {
  return (
    <div className="stat-card">
      <span>Upcoming exams</span>
      <strong>{count}</strong>
      {count === 0 ? <button className="link-inline" onClick={onAdd}>No exams scheduled · Add Exam</button> : <small className="muted">Next: {next || "an upcoming exam"}</small>}
    </div>
  );
}

function Deadlines({ dash }: { dash: ReturnType<typeof useDashboardData> }) {
  const navigate = useNavigate();
  const examsSoon = dash.upcomingExams.slice(0, 4);
  const assignmentsSoon = dash.upcomingAssignments.slice(0, 4);
  const items = [
    ...assignmentsSoon.map((assignment) => ({
      key: `a-${assignment.ItemId ?? assignment.itemId}`,
      title: assignment.title ?? "Assignment",
      meta: dueLabel(assignment.dueDate),
      tone: priorityTone(assignment.priority),
      word: assignment.priority ?? "Medium",
      to: `/assignments/${assignment.ItemId ?? assignment.itemId}`
    })),
    ...examsSoon.map((exam) => ({
      key: `e-${exam.ItemId ?? exam.itemId}`,
      title: exam.name ?? "Exam",
      meta: dueLabel(exam.dateTime?.slice(0, 10)),
      tone: priorityTone(examStateTone(exam.dateTime)),
      word: examStateWord(exam.dateTime),
      to: `/exams/${exam.ItemId ?? exam.itemId}`
    }))
  ];

  if (items.length === 0) {
    return <EmptyState title="Nice work" description="Nothing due in the next two weeks. Nice work." />;
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.key} className="deadline-row">
          <div className="deadline-main">
            <strong>{item.title}</strong>
            <small>{item.meta}</small>
          </div>
          <StatusLabel tone={item.tone}>{item.word}</StatusLabel>
          <button className="icon-button" title="Open" onClick={() => navigate(item.to)}>›</button>
        </div>
      ))}
    </div>
  );
}

function dueLabel(iso: string | undefined): string {
  if (!iso) return "No date";
  const due = iso.slice(0, 10);
  const today = new Date();
  const diff = daysBetween(today, new Date(`${due}T00:00:00`));
  if (diff === 0) return "Due Today";
  if (diff === 1) return "Due Tomorrow";
  if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
  return `Due ${formatDateMedium(due)}`;
}

function examStateWord(iso: string | undefined): string {
  if (!iso) return "Planned";
  const days = daysBetween(new Date(), new Date(iso.slice(0, 10)));
  return examState(Math.max(0, days));
}

function examStateTone(iso: string | undefined): string {
  const word = examStateWord(iso);
  return word === "Today" || word === "Urgent" ? "Critical" : word === "Important" ? "High" : "Medium";
}

function firstNameFromClaims(claims?: Record<string, unknown>): string {
  const value = claims?.given_name ?? claims?.name ?? claims?.firstName;
  return typeof value === "string" ? value : "";
}
