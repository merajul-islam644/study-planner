import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusLabel, priorityTone, statusTone } from "../../shared/ui/indicators";
import { useToast } from "../../shared/ui/toast";
import { assignments } from "../data/entities";
import { formatDateLong, formatDuration } from "../../lib/format";
import { useAssignment, useSubjectMap, effectiveStatus } from "./useAssignments";
import { AssignmentFormModal } from "./AssignmentFormModal";
import { ChecklistSection } from "./ChecklistSection";
import { AttachmentsField } from "../resources/AttachmentsField";
import { NotesSection } from "../notes/NotesSection";

export function AssignmentDetailPage({ assignmentId }: { assignmentId: string }) {
  const navigate = useNavigate();
  const assignment = useAssignment(assignmentId);
  const subjectMap = useSubjectMap();
  const mutations = assignments.useMutations();
  const { show } = useToast();
  const [editing, setEditing] = useState(false);

  if (assignment.isLoading) return <section><Skeleton className="skeleton-block" /></section>;
  if (!assignment.data) {
    return <EmptyState title="Assignment not found" description="We couldn't find that assignment. It may have been removed." action={<button className="primary-button" onClick={() => navigate("/assignments")}>Back to Assignments</button>} />;
  }

  const data = assignment.data;
  const status = effectiveStatus(data);
  const subjectsForForm = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));

  return (
    <section>
      <button className="link-inline" onClick={() => navigate("/assignments")}><ArrowLeft size={15} /> Assignments</button>
      <PageHeader
        title={data.title ?? "Assignment"}
        subtitle={subjectMap.get(data.subjectId ?? "") ?? "Subject"}
        actions={<button className="icon-button" title="Edit assignment" onClick={() => setEditing(true)}><Pencil size={17} /></button>}
      />

      <div className="metrics">
        <div className="metric"><span>Due</span><strong>{data.dueDate ? formatDateLong(data.dueDate) : "—"}</strong></div>
        <div className="metric"><span>Priority</span><StatusLabel tone={priorityTone(data.priority)}>{data.priority}</StatusLabel></div>
        <div className="metric"><span>Status</span><StatusLabel tone={statusTone(status)}>{status}</StatusLabel></div>
        <div className="metric"><span>Estimated time</span><strong>{data.estimatedMinutes ? formatDuration(data.estimatedMinutes) : "—"}</strong></div>
      </div>

      {data.description ? <div className="panel"><div className="panel-title">Description</div><p>{data.description}</p></div> : null}
      {data.notes ? <div className="panel"><div className="panel-title">Notes</div><p>{data.notes}</p></div> : null}

      <ChecklistSection assignment={data} />
      <AttachmentsField attachType="Assignment" attachId={assignmentId} />
      <NotesSection attachType="Assignment" attachId={assignmentId} title="Notes" />

      {editing ? (
        <AssignmentFormModal
          initial={data}
          subjects={subjectsForForm}
          pending={mutations.update.isPending}
          onClose={() => setEditing(false)}
          onSubmit={(values) => mutations.update.mutate({ id: assignmentId, ...values }, { onSuccess: () => { setEditing(false); show("Assignment updated.", "success"); } })}
        />
      ) : null}
    </section>
  );
}
