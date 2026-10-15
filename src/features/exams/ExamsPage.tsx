import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { StatusLabel, examCountdownTone } from "../../shared/ui/indicators";
import { useToast } from "../../shared/ui/toast";
import { exams } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatDateLong, formatClock12 } from "../../lib/format";
import { ExamFormModal } from "./ExamFormModal";
import { useExams, examDaysRemaining, examState, preparationProgress } from "./useExams";
import { useSubjectMap } from "../assignments/useAssignments";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";
import { topics as topicEntity } from "../data/entities";

export function ExamsPage() {
  const navigate = useNavigate();
  const list = useExams();
  const subjectMap = useSubjectMap();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const allTopics = topicEntity.useList();
  const mutations = exams.useMutations();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);

  const sorted = [...(list.data ?? [])].sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""));

  return (
    <section>
      <PageHeader
        title="Exams"
        subtitle="Every exam ahead, with its countdown and preparation progress."
        actions={<button className="primary-button" onClick={() => setCreating(true)} disabled={subjectOptions.length === 0}><Plus size={16} /> Add Exam</button>}
      />

      {subjectOptions.length === 0 ? (
        <EmptyState title="Add a subject first" description="Exams belong to a subject. Add a subject to get started." action={<button className="primary-button" onClick={() => navigate("/subjects")}>Go to Subjects</button>} />
      ) : list.isLoading ? (
        <div className="card-grid">{[0, 1].map((index) => <Skeleton key={index} className="skeleton-card" />)}</div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={26} />}
          title="No exams yet"
          description="Add an exam to see its countdown and track your preparation."
          action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Exam</button>}
        />
      ) : (
        <div className="card-grid">
          {sorted.map((exam) => {
            const days = examDaysRemaining(exam);
            const state = examState(days);
            const prep = preparationProgress(exam, allTopics.data ?? []);
            return (
              <button key={recordId(exam)} className="card" onClick={() => navigate(`/exams/${recordId(exam)}`)}>
                <div className="card-top">
                  <div className="grow">
                    <h3 className="card-title">{exam.name}</h3>
                    <p className="card-sub">{subjectMap.get(exam.subjectId ?? "") ?? "Subject"}</p>
                  </div>
                  <StatusLabel tone={examCountdownTone(state)}>{state}</StatusLabel>
                </div>
                <div className="meta-row">
                  <span>{formatDateLong(exam.dateTime?.slice(0, 10))} · {formatClock12(exam.dateTime?.slice(11, 16))}</span>
                </div>
                <div className="meta-row"><strong>{days}</strong> {days === 1 ? "day remaining" : "days remaining"}</div>
                <div className="progress-bar" role="progressbar" aria-valuenow={prep.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Preparation progress">
                  <span style={{ width: `${prep.percent}%` }} />
                </div>
                <div className="card-sub">{prep.percent}% prepared · {prep.ready} of {prep.total} topics ready</div>
              </button>
            );
          })}
        </div>
      )}

      {creating ? (
        <ExamFormModal
          subjects={subjectOptions}
          topics={topicOptions}
          pending={mutations.create.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate({ ...values, dateTime: `${values.date}T${values.time}:00` }, { onSuccess: () => { setCreating(false); show("Exam added.", "success"); } })}
        />
      ) : null}
    </section>
  );
}
