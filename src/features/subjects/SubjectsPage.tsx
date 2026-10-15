import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { ErrorState } from "../../shared/ui/ErrorState";
import { useToast } from "../../shared/ui/toast";
import { subjects } from "../data/entities";
import { formatDateMedium, formatDuration } from "../../lib/format";
import { colourValue } from "./colours";
import { useSubjectSummaries } from "./useSubjects";
import { SubjectFormModal } from "./SubjectFormModal";

export function SubjectsPage() {
  const navigate = useNavigate();
  const summaries = useSubjectSummaries();
  const mutations = subjects.useMutations();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);

  return (
    <section>
      <PageHeader
        title="Subjects"
        subtitle="Every subject you're studying, with its topics and progress."
        actions={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Subject</button>}
      />

      {summaries.isLoading ? (
        <div className="card-grid">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="skeleton-card" />)}
        </div>
      ) : summaries.data && summaries.data.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={26} />}
          title="No subjects yet"
          description="Add your first subject to start planning your study time."
          action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Subject</button>}
        />
      ) : (
        <div className="card-grid">
          {(summaries.data ?? []).map((summary) => (
            <button key={summary.id} className="card" onClick={() => navigate(`/subjects/${summary.id}`)}>
              <div className="card-top">
                <span className="subject-swatch" style={{ background: colourValue(summary.subject.colour) }} aria-hidden="true" />
                <div className="grow">
                  <h3 className="card-title">{summary.subject.name}</h3>
                  <p className="card-sub">{summary.subject.code}</p>
                </div>
              </div>
              <div className="meta-row">
                <span><strong>{summary.topicCount}</strong> {summary.topicCount === 1 ? "Topic" : "Topics"}</span>
                <span><strong>{summary.progress}%</strong> Progress</span>
              </div>
              <div className="progress-bar" role="progressbar" aria-valuenow={summary.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${summary.subject.name} progress`}>
                <span style={{ width: `${summary.progress}%`, background: colourValue(summary.subject.colour) }} />
              </div>
              <div className="meta-row">
                <span>{summary.totalMinutes > 0 ? formatDuration(summary.totalMinutes) + " studied" : "No study time yet"}</span>
                <span>{summary.nextExamDate ? `Next exam ${formatDateMedium(summary.nextExamDate)}` : "No exam scheduled"}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {mutations.create.isError ? <ErrorState message={(mutations.create.error as Error).message} /> : null}

      {creating ? (
        <SubjectFormModal
          onClose={() => setCreating(false)}
          existingNames={(summaries.data ?? []).map((summary) => summary.subject.name ?? "")}
          pending={mutations.create.isPending}
          onSubmit={(values) => {
            mutations.create.mutate(values, {
              onSuccess: () => {
                setCreating(false);
                show(`Added ${values.name}.`, "success");
              }
            });
          }}
        />
      ) : null}
    </section>
  );
}
