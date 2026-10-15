import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { StatusLabel, priorityTone, statusTone } from "../../shared/ui/indicators";
import { useToast } from "../../shared/ui/toast";
import { assignments } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatDateMedium } from "../../lib/format";
import { AssignmentFormModal } from "./AssignmentFormModal";
import { effectiveStatus } from "./useAssignments";

export function SubjectAssignments({ subjectId, subjectColour }: { subjectId: string; subjectColour: string }) {
  const navigate = useNavigate();
  const list = assignments.useList();
  const mutations = assignments.useMutations();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);

  const items = (list.data ?? []).filter((assignment) => assignment.subjectId === subjectId);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Assignments</h3>
        <button className="ghost-button" onClick={() => setCreating(true)}><Plus size={15} /> Add</button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No assignments yet" description="Add an assignment for this subject." action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Assignment</button>} />
      ) : (
        <div className="list-stack mt8">
          {items.map((assignment) => {
            const status = effectiveStatus(assignment);
            return (
              <button key={recordId(assignment)} className="list-row" onClick={() => navigate(`/assignments/${recordId(assignment)}`)}>
                <div className="list-row-main">
                  <strong>{assignment.title}</strong>
                  <span className="muted">Due {assignment.dueDate ? formatDateMedium(assignment.dueDate) : "no date"}</span>
                </div>
                <div className="row">
                  <StatusLabel tone={priorityTone(assignment.priority)}>{assignment.priority}</StatusLabel>
                  <StatusLabel tone={statusTone(status)}>{status}</StatusLabel>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <span style={{ height: 2, background: subjectColour, display: "block", borderRadius: 999, marginTop: 10 }} aria-hidden="true" />

      {creating ? (
        <AssignmentFormModal
          subjects={[{ id: subjectId, name: "This subject" }]}
          defaultSubjectId={subjectId}
          pending={mutations.create.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate(values, { onSuccess: () => { setCreating(false); show("Assignment added.", "success"); } })}
        />
      ) : null}
    </div>
  );
}
