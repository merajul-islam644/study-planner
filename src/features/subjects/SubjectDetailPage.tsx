import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/toast";
import { StatusLabel, statusTone } from "../../shared/ui/indicators";
import { recordId } from "../../lib/blocks/data";
import { formatDuration } from "../../lib/format";
import { subjects, topics, sessions } from "../data/entities";
import { colourValue } from "./colours";
import { useSubject, topicProgress } from "./useSubjects";
import { TopicFormModal } from "./TopicFormModal";
import { SubjectFormModal } from "./SubjectFormModal";
import { NotesSection } from "../notes/NotesSection";
import { ResourcesSection } from "../resources/ResourcesSection";
import { FlashcardsSection } from "../flashcards/FlashcardsSection";
import { SubjectAssignments } from "../assignments/SubjectAssignments";
import { SubjectExams } from "../exams/SubjectExams";
import type { Topic } from "../data/types";

export function SubjectDetailPage({ subjectId }: { subjectId: string }) {
  const navigate = useNavigate();
  const subject = useSubject(subjectId);
  const topicsList = topics.useList();
  const sessionsList = sessions.useList();
  const subjectMutations = subjects.useMutations();
  const topicMutations = topics.useMutations();
  const { show } = useToast();

  const [editing, setEditing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [removingTopic, setRemovingTopic] = useState<Topic | null>(null);
  const [deleting, setDeleting] = useState(false);

  const label = subject.data?.name ?? "Subject";

  if (subject.isLoading) {
    return <section><Skeleton className="skeleton-line-lg" /><div className="mt16"><Skeleton className="skeleton-block" /></div></section>;
  }

  if (!subject.data) {
    return (
      <EmptyState
        title="Subject not found"
        description="We couldn't find that subject. It may have been removed."
        action={<button className="primary-button" onClick={() => navigate("/subjects")}>Back to Subjects</button>}
      />
    );
  }

  const subjectTopics = (topicsList.data ?? []).filter((topic) => topic.subjectId === subjectId);
  const progress = topicProgress(subjectTopics);
  const subjectSessions = (sessionsList.data ?? []).filter((session) => session.subjectId === subjectId);
  const totalMinutes = subjectSessions.reduce((total, session) => total + (session.actualMinutes || session.durationMinutes || 0), 0);

  return (
    <section>
      <button className="link-inline" onClick={() => navigate("/subjects")}><ArrowLeft size={15} /> Subjects</button>
      <PageHeader
        title={label}
        subtitle={`${subject.data.code ?? ""} · ${subjectTopics.length} ${subjectTopics.length === 1 ? "topic" : "topics"} · ${formatDuration(totalMinutes)} studied`}
        actions={
          <div className="row">
            <button className="icon-button" title="Edit subject" onClick={() => setEditing(true)}><Pencil size={17} /></button>
            <button className="icon-button" title="Delete subject" onClick={() => setDeleting(true)}><Trash2 size={17} /></button>
          </div>
        }
      />

      <div className="metrics">
        <div className="metric"><span>Progress</span><strong>{progress}%</strong></div>
        <div className="metric"><span>Topics</span><strong>{subjectTopics.length}</strong></div>
        <div className="metric"><span>Study time</span><strong>{formatDuration(totalMinutes)}</strong></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Topics</h3>
          <button className="ghost-button" onClick={() => setAddingTopic(true)}><Plus size={15} /> Add Topic</button>
        </div>
        {subjectTopics.length === 0 ? (
          <EmptyState
            title="No topics yet"
            description="No topics yet. Add the units you'll cover in this subject."
            action={<button className="primary-button" onClick={() => setAddingTopic(true)}><Plus size={16} /> Add Topic</button>}
          />
        ) : (
          <div className="list-stack mt8">
            {subjectTopics.map((topic) => (
              <div key={recordId(topic)} className="list-row">
                <div className="list-row-main">
                  <strong>{topic.name}</strong>
                  <span className="muted">{topic.difficulty ? `${topic.difficulty} · ` : ""}{topic.notes || "No notes"}</span>
                </div>
                <div className="row">
                  <StatusLabel tone={statusTone(topic.status)}>{topicMark(topic.status)} {topic.status}</StatusLabel>
                  <button className="icon-button" title="Edit topic" onClick={() => setEditingTopic(topic)}><Pencil size={15} /></button>
                  <button className="icon-button" title="Remove topic" onClick={() => setRemovingTopic(topic)}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SubjectAssignments subjectId={subjectId} subjectColour={colourValue(subject.data.colour)} />
      <SubjectExams subjectId={subjectId} />
      <NotesSection attachType="Subject" attachId={subjectId} title="Notes" />
      <ResourcesSection subjectId={subjectId} />
      <FlashcardsSection subjectId={subjectId} />

      {editing ? (
        <SubjectFormModal
          initial={subject.data}
          existingNames={[]}
          pending={subjectMutations.update.isPending}
          onClose={() => setEditing(false)}
          onSubmit={(values) => subjectMutations.update.mutate({ id: subjectId, ...values }, { onSuccess: () => { setEditing(false); show("Subject updated.", "success"); } })}
        />
      ) : null}

      {addingTopic ? (
        <TopicFormModal
          pending={topicMutations.create.isPending}
          onClose={() => setAddingTopic(false)}
          onSubmit={(values) => topicMutations.create.mutate({ ...values, subjectId }, { onSuccess: () => { setAddingTopic(false); show("Topic added.", "success"); } })}
        />
      ) : null}

      {editingTopic ? (
        <TopicFormModal
          initial={editingTopic}
          pending={topicMutations.update.isPending}
          onClose={() => setEditingTopic(null)}
          onSubmit={(values) => topicMutations.update.mutate({ id: recordId(editingTopic), ...values }, { onSuccess: () => { setEditingTopic(null); show("Topic updated.", "success"); } })}
        />
      ) : null}

      {removingTopic ? (
        <ConfirmDialog
          title="Remove topic"
          message="Remove this topic? Its study sessions stay on the calendar with the topic cleared. This cannot be undone."
          onCancel={() => setRemovingTopic(null)}
          onConfirm={() => {
            const id = recordId(removingTopic);
            // Detach the topic from its sessions first, so they remain on the
            // calendar with the topic cleared.
            (sessionsList.data ?? []).filter((session) => session.topicId === id).forEach((session) => {
              sessions.handle.update(recordId(session), { topicId: "" });
            });
            topicMutations.remove.mutate({ id }, { onSuccess: () => { setRemovingTopic(null); show("Topic removed.", "success"); } });
          }}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete subject"
          message={`Delete ${label}? This action cannot be undone.`}
          onCancel={() => setDeleting(false)}
          onConfirm={() => subjectMutations.remove.mutate({ id: subjectId }, { onSuccess: () => { setDeleting(false); show("Subject deleted.", "success"); navigate("/subjects"); } })}
        />
      ) : null}
    </section>
  );
}

function topicMark(status: string | undefined): string {
  if (status === "Confident") return "✓";
  if (status === "Reviewed") return "✓";
  if (status === "Learning") return "◐";
  return "○";
}
