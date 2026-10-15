import { useState } from "react";
import { BookOpen, CalendarPlus, ClipboardList, GraduationCap, Timer } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { useToast } from "../../shared/ui/toast";
import { assignments, exams, sessions, subjects } from "../data/entities";
import { SessionFormModal } from "../sessions/SessionFormModal";
import { AssignmentFormModal } from "../assignments/AssignmentFormModal";
import { ExamFormModal } from "../exams/ExamFormModal";
import { SubjectFormModal } from "../subjects/SubjectFormModal";
import { useSubjectOptions, useTopicOptions } from "../subjects/useSubjectOptions";
import { todayISO } from "../../lib/format";

type Kind = "session" | "assignment" | "exam" | "subject" | null;

export function QuickActions() {
  const navigate = useNavigate();
  const { show } = useToast();
  const subjectOptions = useSubjectOptions();
  const topicOptions = useTopicOptions();
  const sessionList = sessions.useList();
  const [open, setOpen] = useState<Kind>(null);

  const sessionMutations = sessions.useMutations();
  const assignmentMutations = assignments.useMutations();
  const examMutations = exams.useMutations();
  const subjectMutations = subjects.useMutations();

  return (
    <div className="quick-actions">
      <button className="ghost-button" onClick={() => setOpen("session")} disabled={subjectOptions.length === 0}><CalendarPlus size={15} /> Add Study Session</button>
      <button className="ghost-button" onClick={() => setOpen("assignment")} disabled={subjectOptions.length === 0}><ClipboardList size={15} /> Add Assignment</button>
      <button className="ghost-button" onClick={() => setOpen("exam")} disabled={subjectOptions.length === 0}><GraduationCap size={15} /> Add Exam</button>
      <button className="ghost-button" onClick={() => setOpen("subject")}><BookOpen size={15} /> Add Subject</button>
      <button className="ghost-button" onClick={() => navigate("/focus")} disabled={subjectOptions.length === 0}><Timer size={15} /> Start Focus Session</button>

      {open === "session" ? (
        <SessionFormModal
          subjects={subjectOptions}
          topics={topicOptions}
          existing={sessionList.data ?? []}
          defaultDate={todayISO()}
          pending={sessionMutations.create.isPending}
          onClose={() => setOpen(null)}
          onSubmit={(values) => sessionMutations.create.mutate({ ...values, status: "Upcoming", actualMinutes: 0 }, { onSuccess: () => { setOpen(null); show("Study session added.", "success"); } })}
        />
      ) : null}

      {open === "assignment" ? (
        <AssignmentFormModal
          subjects={subjectOptions}
          pending={assignmentMutations.create.isPending}
          onClose={() => setOpen(null)}
          onSubmit={(values) => assignmentMutations.create.mutate(values, { onSuccess: () => { setOpen(null); show("Assignment added.", "success"); } })}
        />
      ) : null}

      {open === "exam" ? (
        <ExamFormModal
          subjects={subjectOptions}
          topics={topicOptions}
          pending={examMutations.create.isPending}
          onClose={() => setOpen(null)}
          onSubmit={(values) => examMutations.create.mutate({ ...values, dateTime: `${values.date}T${values.time}:00` }, { onSuccess: () => { setOpen(null); show("Exam added.", "success"); } })}
        />
      ) : null}

      {open === "subject" ? (
        <SubjectFormModal
          existingNames={[]}
          pending={subjectMutations.create.isPending}
          onClose={() => setOpen(null)}
          onSubmit={(values) => subjectMutations.create.mutate(values, { onSuccess: () => { setOpen(null); show(`Added ${values.name}.`, "success"); } })}
        />
      ) : null}
    </div>
  );
}
