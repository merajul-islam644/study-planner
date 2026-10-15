import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { StatusLabel, statusTone } from "../../shared/ui/indicators";
import { useToast } from "../../shared/ui/toast";
import { goals } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatDateMedium, formatDuration } from "../../lib/format";
import { GoalFormModal, ExtendDeadlineModal } from "./GoalFormModal";
import { useGoalRows } from "./useGoals";
import type { Goal } from "../data/types";

export function GoalsPage() {
  const rows = useGoalRows();
  const mutations = goals.useMutations();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [extending, setExtending] = useState<Goal | null>(null);
  const [removing, setRemoving] = useState<Goal | null>(null);

  return (
    <section>
      <PageHeader
        title="Goals"
        subtitle="What you're working towards, and how close you are."
        actions={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Goal</button>}
      />

      {rows.isLoading ? (
        <div className="list-stack">{[0, 1].map((index) => <Skeleton key={index} className="skeleton-card" />)}</div>
      ) : (rows.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Target size={26} />}
          title="No goals yet"
          description="Set a goal to give your study a target."
          action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Goal</button>}
        />
      ) : (
        <div className="list-stack">
          {(rows.data ?? []).map(({ goal, id, progress, status, met }) => (
            <div key={id} className="panel mb0">
              <div className="row-between">
                <div className="grow">
                  <h3 style={{ margin: 0 }}>{goal.title}</h3>
                  {goal.description ? <p className="muted">{goal.description}</p> : null}
                </div>
                <StatusLabel tone={statusTone(status)}>{status}</StatusLabel>
              </div>

              <div className="meta-row">
                <strong>{progress.label}</strong>
                <span>{Math.round(Math.min(1, progress.ratio) * 100)}%</span>
                <span>Deadline {goal.deadline ? formatDateMedium(goal.deadline) : "—"}</span>
              </div>

              <div className="progress-bar" role="progressbar" aria-valuenow={Math.round(Math.min(1, progress.ratio) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.title} progress`}>
                <span style={{ width: `${Math.min(100, progress.ratio * 100)}%` }} />
              </div>

              {met && goal.type === "Study hours" ? (
                <p className="muted">Goal complete. You studied {formatDuration(progress.current * 60)} this month.</p>
              ) : status === "Missed" ? (
                <div className="row">
                  <span className="muted">You didn't reach the target in time.</span>
                  <button className="ghost-button" onClick={() => setExtending(goal)}>Extend deadline</button>
                </div>
              ) : null}

              <div className="row wrap">
                <button className="ghost-button" onClick={() => setEditing(goal)}>Edit</button>
                <button className="ghost-button" onClick={() => setExtending(goal)}>Extend deadline</button>
                <button className="icon-button" onClick={() => setRemoving(goal)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating ? (
        <GoalFormModal
          pending={mutations.create.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate(values, { onSuccess: () => { setCreating(false); show("Goal added.", "success"); } })}
        />
      ) : null}

      {editing ? (
        <GoalFormModal
          initial={editing}
          pending={mutations.update.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(values) => mutations.update.mutate({ id: recordId(editing), ...values }, { onSuccess: () => { setEditing(null); show("Goal updated.", "success"); } })}
        />
      ) : null}

      {extending ? (
        <ExtendDeadlineModal
          goal={extending}
          pending={mutations.update.isPending}
          onClose={() => setExtending(null)}
          onSubmit={(deadline) => mutations.update.mutate({ id: recordId(extending), deadline, status: "Active" }, { onSuccess: () => { setExtending(null); show("Deadline extended.", "success"); } })}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Delete goal"
          message="Delete this goal? This action cannot be undone."
          onCancel={() => setRemoving(null)}
          onConfirm={() => mutations.remove.mutate({ id: recordId(removing) }, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}
    </section>
  );
}
