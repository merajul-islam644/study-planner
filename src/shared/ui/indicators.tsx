import type { ReactNode } from "react";

// Status is never carried by colour alone -- every marker pairs a colour with
// a word, and charts carry a text summary for screen readers.

export type Tone = "good" | "warn" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  good: "pill-good",
  warn: "pill-warn",
  danger: "pill-danger",
  info: "pill-info",
  neutral: "pill-neutral"
};

export function StatusLabel({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`pill ${TONE_CLASS[tone]}`}>{children}</span>;
}

export function priorityTone(priority: string | undefined): Tone {
  switch (priority) {
    case "Critical":
      return "danger";
    case "High":
      return "warn";
    case "Medium":
      return "info";
    default:
      return "neutral";
  }
}

export function statusTone(status: string | undefined): Tone {
  switch (status) {
    case "Completed":
    case "Met":
    case "Confident":
    case "Active":
      return "good";
    case "In Progress":
    case "Learning":
      return "info";
    case "Reviewed":
      return "info";
    case "Overdue":
    case "Missed":
      return "danger";
    case "Skipped":
      return "warn";
    default:
      return "neutral";
  }
}

export function examCountdownTone(state: string): Tone {
  switch (state) {
    case "Today":
    case "Urgent":
      return "danger";
    case "Important":
      return "warn";
    case "Preparing":
      return "info";
    default:
      return "neutral";
  }
}

export function ProgressRing({ ratio, label, size = 120 }: { ratio: number; label?: string; size?: number }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * clamped;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? undefined}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {label ? <span className="progress-ring-label">{label}</span> : null}
    </div>
  );
}

export function ProgressBar({ ratio, label }: { ratio: number; label: string }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}
