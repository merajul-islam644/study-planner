import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { EmptyState } from "../../shared/ui/EmptyState";
import { useToast } from "../../shared/ui/toast";
import { exams } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { ExamCountdown } from "./ExamCountdown";
import { ExamFormModal } from "./ExamFormModal";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";

export function SubjectExams({ subjectId }: { subjectId: string }) {
  const navigate = useNavigate();
  const list = exams.useList();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const mutations = exams.useMutations();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);

  const items = (list.data ?? []).filter((exam) => exam.subjectId === subjectId).sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""));

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Exams</h3>
        <button className="ghost-button" onClick={() => setCreating(true)}><Plus size={15} /> Add</button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No exams yet" description="Add an exam to track its countdown." action={<button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> Add Exam</button>} />
      ) : (
        <div className="list-stack mt8">
          {items.map((exam) => (
            <button key={recordId(exam)} className="list-row" onClick={() => navigate(`/exams/${recordId(exam)}`)}>
              <div className="list-row-main"><strong>{exam.name}</strong></div>
              <ExamCountdown exam={exam} />
            </button>
          ))}
        </div>
      )}

      {creating ? (
        <ExamFormModal
          subjects={subjectOptions}
          topics={topicOptions}
          defaultSubjectId={subjectId}
          pending={mutations.create.isPending}
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate({ ...values, subjectId, dateTime: `${values.date}T${values.time}:00` }, { onSuccess: () => { setCreating(false); show("Exam added.", "success"); } })}
        />
      ) : null}
    </div>
  );
}
