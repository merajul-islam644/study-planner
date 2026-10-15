import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusLabel, priorityTone, statusTone } from "../../shared/ui/indicators";
import { useToast } from "../../shared/ui/toast";
import { assignments } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatDateMedium } from "../../lib/format";
import { AssignmentFormModal } from "./AssignmentFormModal";
import { effectiveStatus, filterAssignments, useAssignments, useSubjectMap } from "./useAssignments";
import type { AssignmentFilter } from "./useAssignments";

const FILTERS: AssignmentFilter[] = ["All", "Today", "Upcoming", "Overdue", "Completed"];

export function AssignmentsPage() {
  const navigate = useNavigate();
  const list = useAssignments();
  const subjectMap = useSubjectMap();
  const mutations = assignments.useMutations();
  const { show } = useToast();

  const [filter, setFilter] = useState<AssignmentFilter>("All");
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [creating, setCreating] = useState(false);

  const subjectsForForm = Array.from(subjectMap.entries()).map(([id, name]) => ({ id, name }));
  const all = list.data ?? [];
  const visible = filterAssignments(all, filter, subjectFilter, priorityFilter);
  const hasFilters = subjectFilter.length > 0 || priorityFilter !== "All" || filter !== "All";

  return (
    <section>
      <PageHeader
        title="Assignments"
        subtitle="Everything you need to hand in, with priorities and checklists."
        actions={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Assignment</button>}
      />

      <div className="filter-chips mb0">
        {FILTERS.map((option) => (
          <button key={option} className={`filter-chip ${filter === option ? "active" : ""}`} onClick={() => setFilter(option)}>{option}</button>
        ))}
      </div>

      {subjectsForForm.length > 0 ? (
        <div className="filter-grid mt8">
          <label className="form-field">
            <span>Subject</span>
            <select value={subjectFilter[0] ?? ""} onChange={(event) => setSubjectFilter(event.target.value ? [event.target.value] : [])}>
              <option value="">All subjects</option>
              {subjectsForForm.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Priority</span>
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="All">All priorities</option>
              {["Low", "Medium", "High", "Critical"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {list.isLoading ? (
        <Skeleton className="skeleton-block" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={26} />}
          title={all.length === 0 ? "No assignments yet" : "No assignments match these filters"}
          description={all.length === 0 ? "Add an assignment to keep track of what's due." : `No assignments match these filters. Clear filters to see all ${all.length}.`}
          action={hasFilters ? <button className="ghost-button" onClick={() => { setFilter("All"); setSubjectFilter([]); setPriorityFilter("All"); }}>Clear filters</button> : <button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Assignment</button>}
        />
      ) : (
        <div className="list-stack">
          {visible.map((assignment) => {
            const status = effectiveStatus(assignment);
            return (
              <button key={recordId(assignment)} className="list-row" onClick={() => navigate(`/assignments/${recordId(assignment)}`)}>
                <div className="list-row-main">
                  <strong>{assignment.title}</strong>
                  <span className="muted">{subjectMap.get(assignment.subjectId ?? "") ?? "Subject"} · Due {assignment.dueDate ? formatDateMedium(assignment.dueDate) : "no date"}</span>
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

      {creating ? (
        <AssignmentFormModal
          subjects={subjectsForForm}
          pending={mutations.create.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate(values, { onSuccess: () => { setCreating(false); show("Assignment added.", "success"); } })}
        />
      ) : null}
    </section>
  );
}
