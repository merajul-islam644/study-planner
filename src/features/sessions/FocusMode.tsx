import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { useToast } from "../../shared/ui/toast";
import { sessions, notifications } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { useOwnerId } from "../data/store";
import { useSubjectMap } from "../assignments/useAssignments";
import { useSessions } from "./useSessions";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";

type Mode = { key: string; label: string; focus: number; break: number };

const MODES: Mode[] = [
  { key: "25", label: "25 min Focus / 5 min Break", focus: 25, break: 5 },
  { key: "50", label: "50 min Focus / 10 min Break", focus: 50, break: 10 },
  { key: "custom", label: "Custom", focus: 30, break: 5 }
];
const DEFAULT_MODE = MODES[0] as Mode;

// Focus mode counts real study time against a session: pause stops the clock,
// resume continues from the same point, and finishing records actual minutes
// and asks for a reflection.
export function FocusMode() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("sessionId") ?? undefined;
  const navigate = useNavigate();
  const list = useSessions();
  const subjectMap = useSubjectMap();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const mutations = sessions.useMutations();
  const ownerId = useOwnerId();
  const { show } = useToast();

  const session = (list.data ?? []).find((item) => recordId(item) === sessionId);
  const [subjectId, setSubjectId] = useState(session?.subjectId ?? subjectOptions[0]?.id ?? "");
  const [topicId, setTopicId] = useState(session?.topicId ?? "");
  const [modeKey, setModeKey] = useState("25");
  const [customFocus, setCustomFocus] = useState(45);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reflection, setReflection] = useState("");
  const warnedRef = useRef(false);

  const mode = MODES.find((entry) => entry.key === modeKey) ?? DEFAULT_MODE;
  const targetSeconds = (modeKey === "custom" ? customFocus : mode.focus) * 60;

  useEffect(() => {
    if (!running) return;
    if (elapsed >= targetSeconds) {
      setRunning(false);
      setFinished(true);
      return;
    }
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, elapsed, targetSeconds]);

  // Leaving the page while the timer runs notifies the student it is still
  // going -- once per focus run.
  useEffect(() => {
    if (!running || warnedRef.current) return;
    function onHidden() {
      if (document.visibilityState === "hidden" && running && !warnedRef.current) {
        warnedRef.current = true;
        if (ownerId) {
          notifications.handle.create({ ownerId, topic: "Focus timer", kind: "focus", read: false, message: "Your focus timer is still running." }).catch(() => undefined);
        }
      }
    }
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [running, ownerId]);

  const minutesStudied = Math.round(elapsed / 60);
  const remaining = Math.max(0, targetSeconds - elapsed);

  function finish() {
    setRunning(false);
    setFinished(true);
  }

  function saveReflection() {
    const minutes = Math.max(1, minutesStudied || mode.focus);
    if (session) {
      mutations.update.mutate({
        id: recordId(session),
        actualMinutes: (session.actualMinutes ?? 0) + minutes,
        status: "Completed",
        reflection
      }, { onSuccess: () => { show("Focus session saved.", "success"); navigate("/sessions"); } });
    } else if (subjectId) {
      mutations.create.mutate({
        subjectId,
        topicId,
        date: new Date().toISOString().slice(0, 10),
        startTime: new Date().toTimeString().slice(0, 5),
        durationMinutes: minutes,
        actualMinutes: minutes,
        studyType: "Learning",
        status: "Completed",
        reflection
      }, { onSuccess: () => { show("Focus session saved.", "success"); navigate("/sessions"); } });
    } else {
      show("Choose a subject first.", "error");
    }
  }

  const heading = useMemo(() => subjectMap.get(subjectId) ?? "Focus session", [subjectMap, subjectId]);

  if (finished) {
    return (
      <section>
        <PageHeader title="Focus complete" subtitle="Nice work — here's your session." />
        <div className="focus-screen">
          <p className="flashcard-question">Great work! You studied for {minutesStudied || mode.focus} minutes. What did you accomplish?</p>
          <textarea style={{ maxWidth: 520 }} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="Reviewed the chain rule and did 10 practice questions." />
          <button className="primary-button" onClick={saveReflection} disabled={mutations.update.isPending || mutations.create.isPending}>Save reflection</button>
          <button className="ghost-button" onClick={() => { setFinished(false); setElapsed(0); warnedRef.current = false; }}>Start another</button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader title="Focus mode" subtitle="Keep this tab open while you study." actions={<button className="ghost-button" onClick={() => navigate("/sessions")}>Close</button>} />
      <div className="focus-screen">
        <p className="muted">{heading}{topicId ? ` · ${topicOptions.find((topic) => topic.id === topicId)?.name ?? ""}` : ""}</p>
        <div className="focus-clock" aria-live="polite">{formatClock(remaining)}</div>

        {!session ? (
          <div className="field-grid" style={{ maxWidth: 520, width: "100%" }}>
            <label className="form-field">
              <span>Subject</span>
              <select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setTopicId(""); }}>
                {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Topic</span>
              <select value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                <option value="">No topic</option>
                {topicOptions.filter((topic) => topic.subjectId === subjectId).map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
              </select>
            </label>
          </div>
        ) : null}

        <div className="choice-row" role="radiogroup" aria-label="Timer mode">
          {MODES.map((entry) => (
            <button key={entry.key} type="button" role="radio" aria-checked={modeKey === entry.key} className={`choice ${modeKey === entry.key ? "selected" : ""}`} onClick={() => { setModeKey(entry.key); setElapsed(0); setRunning(false); }}>{entry.label}</button>
          ))}
        </div>
        {modeKey === "custom" ? (
          <label className="form-field" style={{ maxWidth: 220 }}>
            <span>Custom focus minutes</span>
            <input type="number" min={5} value={customFocus} onChange={(event) => { setCustomFocus(Number(event.target.value) || 5); setElapsed(0); }} />
          </label>
        ) : null}

        <div className="row">
          {running ? (
            <button className="primary-button" onClick={() => setRunning(false)}>Pause</button>
          ) : (
            <button className="primary-button" onClick={() => setRunning(true)}>{elapsed > 0 ? "Resume" : "Start"}</button>
          )}
          <button className="ghost-button" onClick={finish}>Finish</button>
        </div>
      </div>
    </section>
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
