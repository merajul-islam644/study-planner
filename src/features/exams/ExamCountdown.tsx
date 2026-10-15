import { StatusLabel, examCountdownTone } from "../../shared/ui/indicators";
import { examDaysRemaining, examState } from "./useExams";
import { formatDateTime } from "../../lib/format";
import type { Exam } from "../data/types";

// The countdown block: "12 Days Remaining" plus a state word beside its colour.
export function ExamCountdown({ exam, large = false }: { exam: Exam; large?: boolean }) {
  const days = examDaysRemaining(exam);
  const state = examState(days);
  const remainingLabel = state === "Today" ? "Today" : `${days} ${days === 1 ? "Day" : "Days"} Remaining`;
  return (
    <div className={`countdown-block ${large ? "countdown-lg" : ""}`}>
      <div className="countdown-value">{remainingLabel}</div>
      <StatusLabel tone={examCountdownTone(state)}>{state}</StatusLabel>
      {large ? <div className="muted">{formatDateTime(exam.dateTime)}</div> : null}
    </div>
  );
}
