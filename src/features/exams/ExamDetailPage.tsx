import { ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toast";
import { exams, topics as topicEntity } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { ExamCountdown } from "./ExamCountdown";
import { ExamFormModal } from "./ExamFormModal";
import { preparationProgress } from "./useExams";
import { useExam } from "./useExams";
import { useSubjectMap } from "../assignments/useAssignments";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";
import { NotesSection } from "../notes/NotesSection";
import type { TopicStatus } from "../data/types";

const STATUSES: TopicStatus[] = ["Not Started", "Learning", "Reviewed", "Confident"];

export function ExamDetailPage({ examId }: { examId: string }) {
  const navigate = useNavigate();
  const exam = useExam(examId);
  const subjectMap = useSubjectMap();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const allTopics = topicEntity.useList();
  const topicMutations = topicEntity.useMutations();
  const mutations = exams.useMutations();
  const { show } = useToast();
  const [editing, setEditing] = useState(false);

  if (exam.isLoading) return <section><Skeleton className="skeleton-block" /></section>;
  if (!exam.data) {
    return <EmptyState title="Exam not found" description="We couldn't find that exam. It may have been removed." action={<button className="primary-button" onClick={() => navigate("/exams")}>Back to Exams</button>} />;
  }

  const data = exam.data;
  const covered = (data.topicIds ?? []).map((id) => (allTopics.data ?? []).find((topic) => recordId(topic) === id)).filter(Boolean);
  const prep = preparationProgress(data, allTopics.data ?? []);

  // Only the changed topic's status is written; the others keep theirs.
  function setTopicStatus(topicId: string, status: TopicStatus) {
    topicMutations.update.mutate({ id: topicId, status });
  }

  const subjectTopics = (allTopics.data ?? []).filter((topic) => topic.subjectId === data.subjectId);

  return (
    <section>
      <button className="link-inline" onClick={() => navigate("/exams")}><ArrowLeft size={15} /> Exams</button>
      <PageHeader
        title={data.name ?? "Exam"}
        subtitle={subjectMap.get(data.subjectId ?? "") ?? "Subject"}
        actions={<button className="icon-button" title="Edit exam" onClick={() => setEditing(true)}><Pencil size={17} /></button>}
      />

      <div className="panel">
        <div className="panel-title">Countdown</div>
        <ExamCountdown exam={data} large />
        {data.location ? <p className="muted">Location: {data.location}</p> : null}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Preparation Progress {prep.percent}%</h3>
          <span className="muted">{prep.ready} of {prep.total} ready</span>
        </div>
        <div className="progress-bar mb0" role="progressbar" aria-valuenow={prep.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Preparation progress">
          <span style={{ width: `${prep.percent}%` }} />
        </div>

        <div className="mt16">
          {covered.length === 0 ? (
            <p className="muted">No topics attached yet. Pick the topics this exam covers.</p>
          ) : (
            covered.map((topic) => (
              <div key={recordId(topic!)} className="list-row mb0">
                <strong>{topic!.name}</strong>
                <div className="choice-row">
                  {STATUSES.map((status) => (
                    <button key={status} className={`choice ${topic!.status === status ? "selected" : ""}`} onClick={() => setTopicStatus(recordId(topic!), status)}>{status}</button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {covered.length > 0 && subjectTopics.length > covered.length ? (
          <p className="helper-text mt8">Edit the exam to add more topics.</p>
        ) : null}
      </div>

      {data.notes ? <div className="panel"><div className="panel-title">Notes</div><p>{data.notes}</p></div> : null}
      <NotesSection attachType="Exam" attachId={examId} title="Notes" />

      {editing ? (
        <ExamFormModal
          initial={data}
          subjects={subjectOptions}
          topics={topicOptions}
          pending={mutations.update.isPending}
          onClose={() => setEditing(false)}
          onSubmit={(values) => mutations.update.mutate({ id: examId, ...values, dateTime: `${values.date}T${values.time}:00` }, { onSuccess: () => { setEditing(false); show("Exam updated.", "success"); } })}
        />
      ) : null}
    </section>
  );
}
