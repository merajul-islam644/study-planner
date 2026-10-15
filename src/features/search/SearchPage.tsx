import { useMemo, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { useNavigate } from "../../app/router/navigation";
import { notes, subjects, topics, assignments, exams, sessions, goals } from "../data/entities";
import { recordId } from "../../lib/blocks/data";

type Group = { heading: string; to: (id: string) => string; rows: { id: string; label: string; sub?: string }[] };

// Global search covers subjects, assignments, exams, study sessions, topics,
// notes and goals -- no search runs until the third character.
export function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const subjectsList = subjects.useList();
  const topicsList = topics.useList();
  const assignmentsList = assignments.useList();
  const examsList = exams.useList();
  const sessionsList = sessions.useList();
  const notesList = notes.useList();
  const goalsList = goals.useList();

  const groups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (value: string | undefined) => (value ?? "").toLowerCase().includes(q);
    return [
      { heading: "Subjects", to: (id: string) => `/subjects/${id}`, rows: (subjectsList.data ?? []).filter((item) => match(item.name) || match(item.code)).map((item) => ({ id: recordId(item), label: item.name ?? "Subject", sub: item.code })) },
      { heading: "Topics", to: (id: string) => `/subjects/${topicsList.data?.find((topic) => recordId(topic) === id)?.subjectId ?? ""}`, rows: (topicsList.data ?? []).filter((item) => match(item.name)).map((item) => ({ id: recordId(item), label: item.name ?? "Topic" })) },
      { heading: "Assignments", to: (id: string) => `/assignments/${id}`, rows: (assignmentsList.data ?? []).filter((item) => match(item.title)).map((item) => ({ id: recordId(item), label: item.title ?? "Assignment" })) },
      { heading: "Exams", to: (id: string) => `/exams/${id}`, rows: (examsList.data ?? []).filter((item) => match(item.name)).map((item) => ({ id: recordId(item), label: item.name ?? "Exam" })) },
      { heading: "Study sessions", to: (_id: string) => `/sessions`, rows: (sessionsList.data ?? []).filter((item) => match(item.studyType) || match(item.notes || openLabel(item))).map((item) => ({ id: recordId(item), label: `${item.studyType ?? "Session"} · ${item.date ?? ""}` })) },
      { heading: "Notes", to: (_id: string) => `/subjects`, rows: (notesList.data ?? []).filter((item) => match(item.title) || match(item.body) || (item.tags ?? []).some((tag) => match(tag))).map((item) => ({ id: recordId(item), label: item.title || "Note", sub: (item.tags ?? []).join(", ") })) },
      { heading: "Goals", to: (_id: string) => `/goals`, rows: (goalsList.data ?? []).filter((item) => match(item.title)).map((item) => ({ id: recordId(item), label: item.title ?? "Goal" })) }
    ].filter((group) => group.rows.length > 0);
  }, [query, subjectsList.data, topicsList.data, assignmentsList.data, examsList.data, sessionsList.data, notesList.data, goalsList.data]);

  const longEnough = query.trim().length >= 3;

  return (
    <section>
      <PageHeader title="Search" subtitle="Find anything across your study records." />

      <div className="search-box mb0" style={{ maxWidth: 520 }}>
        <SearchIcon size={16} />
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subjects, assignments, exams, notes…" aria-label="Search" />
      </div>

      {!longEnough ? (
        <p className="muted mt8">Type at least three characters to search.</p>
      ) : groups.length === 0 ? (
        <div className="mt16">
          <EmptyState title="No results" description={`No results for "${query.trim()}". Check the spelling or add it as a subject.`} action={<button className="primary-button" onClick={() => navigate("/subjects")}>Add a subject</button>} />
        </div>
      ) : (
        <div className="search-groups mt16">
          {groups.map((group) => (
            <div key={group.heading} className="search-group">
              <h3>{group.heading}</h3>
              <div className="list-stack">
                {group.rows.map((row) => (
                  <button key={`${group.heading}-${row.id}`} className="result-row" onClick={() => navigate(group.to(row.id))}>
                    <strong>{row.label}</strong>
                    {row.sub ? <span className="muted">{row.sub}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function openLabel(session: { startTime?: string }): string {
  return session.startTime ?? "";
}
