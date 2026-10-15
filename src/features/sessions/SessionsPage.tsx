import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusLabel, statusTone } from "../../shared/ui/indicators";
import { useToast } from "../../shared/ui/toast";
import { sessions } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatClock12, formatDateMedium, formatDuration } from "../../lib/format";
import { SessionFormModal } from "./SessionFormModal";
import { effectiveSessionStatus, sessionMinutes, useSessions } from "./useSessions";
import { useSubjectMap } from "../assignments/useAssignments";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";

const STUDY_TYPES = ["Learning", "Revision", "Practice", "Homework", "Exam Preparation"];

export function SessionsPage() {
  const navigate = useNavigate();
  const list = useSessions();
  const subjectMap = useSubjectMap();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const mutations = sessions.useMutations();
  const { show } = useToast();

  const [subjectFilter, setSubjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [range, setRange] = useState<"Day" | "Week" | "All">("Week");
  const [visible, setVisible] = useState(20);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let items = list.data ?? [];
    if (subjectFilter) items = items.filter((session) => session.subjectId === subjectFilter);
    if (typeFilter) items = items.filter((session) => session.studyType === typeFilter);
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.data, subjectFilter, typeFilter, range]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    [...filtered]
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .forEach((session) => {
        const key = session.date?.slice(0, 10) ?? "No date";
        map.set(key, [...(map.get(key) ?? []), session]);
      });
    return Array.from(map.entries()).slice(0, visible);
  }, [filtered, visible]);

  const hasFilters = Boolean(subjectFilter || typeFilter || range !== "Week");

  return (
    <section>
      <PageHeader
        title="Study Sessions"
        subtitle="Your study history, grouped by day."
        actions={<button className="primary-button" onClick={() => setCreating(true)} disabled={subjectOptions.length === 0}><Plus size={16} /> Add Session</button>}
      />

      <div className="filter-grid">
        <label className="form-field">
          <span>Day</span>
          <select value={range} onChange={(event) => setRange(event.target.value as typeof range)}>
            <option value="Day">Today</option>
            <option value="Week">This week and earlier</option>
            <option value="All">All time</option>
          </select>
        </label>
        <label className="form-field">
          <span>Subject</span>
          <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
            <option value="">All subjects</option>
            {subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span>Study type</span>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">All types</option>
            {STUDY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>

      {subjectOptions.length === 0 ? (
        <EmptyState title="Add a subject first" description="Study sessions belong to a subject. Add a subject to get started." action={<button className="primary-button" onClick={() => navigate("/subjects")}>Go to Subjects</button>} />
      ) : list.isLoading ? (
        <Skeleton className="skeleton-block" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No sessions match these filters"
          description={hasFilters ? "No sessions match these filters. Clear filters to see all your history." : "Add your first study session to start building your history."}
          action={hasFilters ? <button className="ghost-button" onClick={() => { setSubjectFilter(""); setTypeFilter(""); setRange("Week"); }}>Clear filters</button> : <button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Session</button>}
        />
      ) : (
        <div className="list-stack">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h3 className="mt8">{formatDateMedium(date)}</h3>
              <div className="list-stack">
                {items.map((session) => {
                  const status = effectiveSessionStatus(session);
                  return (
                    <div key={recordId(session)} className="list-row">
                      <div className="list-row-main">
                        <strong>{subjectMap.get(session.subjectId ?? "") ?? "Subject"}</strong>
                        <span className="muted">{formatClock12(session.startTime)} · {formatDuration(sessionMinutes(session))} · {session.studyType}</span>
                      </div>
                      <div className="row">
                        <StatusLabel tone={statusTone(status)}>{status}</StatusLabel>
                        <button className="ghost-button" onClick={() => navigate(`/planner?date=${date}`)}>Open</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length > grouped.reduce((total, [, items]) => total + items.length, 0) ? (
            <button className="ghost-button" onClick={() => setVisible((value) => value + 20)}>Load more</button>
          ) : null}
        </div>
      )}

      {creating ? (
        <SessionFormModal
          subjects={subjectOptions}
          topics={topicOptions}
          existing={list.data ?? []}
          pending={mutations.create.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate({ ...values, status: "Upcoming", actualMinutes: 0 }, { onSuccess: () => { setCreating(false); show("Study session added.", "success"); } })}
        />
      ) : null}
    </section>
  );
}
