import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { Alert } from "../../shared/ui/Alert";
import { subjects as subjectEntity, assignments, exams, goals } from "../data/entities";
import { useProfileMutations, useProfile } from "../data/store";
import { colourValue, SUBJECT_COLOURS } from "../subjects/colours";
import { buildSuggestedCode } from "../subjects/useSubjects";
import { WEEKDAY_NAMES } from "../../lib/format";

const SUGGESTIONS = ["Mathematics", "Physics", "Computer Science", "English", "Chemistry"];

type DraftSubject = { name: string; code: string; colour: string; instructor: string; description: string };

export function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const profileMutations = useProfileMutations();
  const subjectMutations = subjectEntity.useMutations();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [name, setName] = useState(profile.data?.name ?? "");
  const [educationLevel, setEducationLevel] = useState(profile.data?.educationLevel ?? "University");
  const [institution, setInstitution] = useState(profile.data?.institution ?? "");
  const [term, setTerm] = useState(profile.data?.term ?? "");
  const [academicGoal, setAcademicGoal] = useState(profile.data?.academicGoal ?? "");

  const [draftSubjects, setDraftSubjects] = useState<DraftSubject[]>([]);
  const [newSubject, setNewSubject] = useState<DraftSubject>({ name: "", code: "", colour: SUBJECT_COLOURS[0], instructor: "", description: "" });

  const [preferredDays, setPreferredDays] = useState<string[]>(profile.data?.preferredDays ?? []);
  const [preferredHours, setPreferredHours] = useState(profile.data?.preferredHours ?? "");
  const [avgSession, setAvgSession] = useState(profile.data?.avgSessionMinutes ? String(profile.data.avgSessionMinutes) : "60");
  const [dailyTarget, setDailyTarget] = useState(profile.data?.dailyTargetMinutes ? String(profile.data.dailyTargetMinutes) : "");
  const [weeklyTarget, setWeeklyTarget] = useState(profile.data?.weeklyTargetMinutes ? String(profile.data.weeklyTargetMinutes) : "");

  const [saving, setSaving] = useState(false);

  const assignmentsCount = assignments.useList().data?.length ?? 0;
  const examsCount = exams.useList().data?.filter((exam) => (exam.dateTime?.slice(0, 10) ?? "") >= new Date().toISOString().slice(0, 10)).length ?? 0;
  const goalsCount = goals.useList().data?.length ?? 0;

  function addSubject() {
    if (!newSubject.name.trim()) { setError("Enter a subject name."); return; }
    if (!newSubject.code.trim()) { setError("Enter a short code."); return; }
    setDraftSubjects((current) => [...current, { ...newSubject, code: newSubject.code.toUpperCase() }]);
    setNewSubject({ name: "", code: "", colour: SUBJECT_COLOURS[(draftSubjects.length + 1) % SUBJECT_COLOURS.length] ?? "Teal", instructor: "", description: "" });
    setError("");
  }

  async function finish() {
    setSaving(true);
    try {
      for (const subject of draftSubjects) {
        await subjectMutations.create.mutateAsync({ name: subject.name, code: subject.code, colour: subject.colour, instructor: subject.instructor, description: subject.description });
      }
      await profileMutations.save.mutateAsync({
        name,
        educationLevel,
        institution,
        term,
        academicGoal,
        preferredDays,
        preferredHours,
        avgSessionMinutes: Number(avgSession) || 60,
        dailyTargetMinutes: dailyTarget ? Number(dailyTarget) * 60 : 120,
        weeklyTargetMinutes: weeklyTarget ? Number(weeklyTarget) * 60 : 840,
        appearance: profile.data?.appearance ?? "system",
        onboarded: true
      });
      navigate("/dashboard");
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding-steps">
        {[1, 2, 3, 4, 5].map((value) => (
          <span key={value} className={`onboarding-dot ${step === value ? "active" : step > value ? "done" : ""}`}>{value}</span>
        ))}
      </div>

      <div className="onboarding-card">
        {step === 1 ? (
          <>
            <h2>Welcome to Study Planner</h2>
            <p>Welcome to Study Planner. Let's build a study system that works for you.</p>
            <div className="form-actions"><button className="primary-button" onClick={() => setStep(2)}>Get Started</button></div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>Academic information</h2>
            <p>Tell us about your studies.</p>
            <div className="field-grid">
              <label className="form-field field-span"><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
              <div className="form-field">
                <span>Education level</span>
                <div className="choice-row" role="radiogroup" aria-label="Education level">
                  {["School", "College", "University", "Other"].map((option) => (
                    <button key={option} type="button" role="radio" aria-checked={educationLevel === option} className={`choice ${educationLevel === option ? "selected" : ""}`} onClick={() => setEducationLevel(option)}>{option}</button>
                  ))}
                </div>
              </div>
              <label className="form-field"><span>Institution</span><input value={institution} onChange={(event) => { setInstitution(event.target.value); setError(""); }} /></label>
              <label className="form-field"><span>Current semester or term</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Autumn 2026" /></label>
              <label className="form-field field-span"><span>Academic goal (optional)</span><input value={academicGoal} onChange={(event) => setAcademicGoal(event.target.value)} placeholder="Graduate with honours" /></label>
            </div>
            {error ? <div className="field-error mt8">{error}</div> : null}
            <div className="modal-actions mt16">
              <button className="icon-button" onClick={() => setStep(1)}>Back</button>
              <button className="primary-button" onClick={() => { if (!institution.trim()) { setError("Institution is required."); return; } setError(""); setStep(3); }}>Continue</button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2>Add subjects</h2>
            <p>Add the subjects you're studying. You've added {draftSubjects.length}.</p>
            <div className="field-grid">
              <label className="form-field">
                <span>Subject name</span>
                <input value={newSubject.name} onChange={(event) => { const value = event.target.value; setNewSubject((current) => ({ ...current, name: value, code: current.code || buildSuggestedCode(value) })); }} placeholder="Mathematics" />
              </label>
              <label className="form-field">
                <span>Short code</span>
                <input value={newSubject.code} maxLength={8} onChange={(event) => setNewSubject((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="MATH" />
              </label>
            </div>
            <div className="choice-row mt8">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" className="choice" onClick={() => setNewSubject((current) => ({ ...current, name: suggestion, code: buildSuggestedCode(suggestion) }))}>{suggestion}</button>
              ))}
            </div>
            <div className="choice-row mt8">
              {SUBJECT_COLOURS.map((option) => (
                <button key={option} type="button" aria-label={option} className={`colour-choice ${newSubject.colour === option ? "selected" : ""}`} style={{ background: colourValue(option) }} onClick={() => setNewSubject((current) => ({ ...current, colour: option }))} />
              ))}
            </div>
            <button className="ghost-button mt8" onClick={addSubject}><Plus size={15} /> Add subject</button>

            {draftSubjects.length > 0 ? (
              <div className="list-stack mt16">
                {draftSubjects.map((subject, index) => (
                  <div key={`${subject.name}-${index}`} className="subject-chip">
                    <span className="row"><span className="subject-swatch" style={{ background: colourValue(subject.colour) }} /> {subject.name} · {subject.code}</span>
                    <button className="icon-button" onClick={() => setDraftSubjects((current) => current.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            ) : null}

            {error ? <div className="field-error mt8">{error}</div> : null}
            <div className="modal-actions mt16">
              <button className="icon-button" onClick={() => setStep(2)}>Back</button>
              <button className="primary-button" onClick={() => { if (draftSubjects.length === 0) { setError("Add at least one subject to continue."); return; } setError(""); setStep(4); }}>Continue</button>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2>Study preferences</h2>
            <p>How and when you like to study.</p>
            <div className="form-field">
              <span>Preferred study days</span>
              <div className="choice-row">
                {WEEKDAY_NAMES.map((day) => (
                  <button key={day} type="button" aria-pressed={preferredDays.includes(day)} className={`choice day-choice ${preferredDays.includes(day) ? "selected" : ""}`} onClick={() => setPreferredDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])}>{day.slice(0, 3)}</button>
                ))}
              </div>
            </div>
            <div className="field-grid mt8">
              <label className="form-field"><span>Preferred study hours</span><input value={preferredHours} onChange={(event) => setPreferredHours(event.target.value)} placeholder="18:00 – 21:00" /></label>
              <label className="form-field"><span>Average session duration (minutes)</span><input type="number" value={avgSession} onChange={(event) => setAvgSession(event.target.value)} /></label>
              <label className="form-field"><span>Daily study target (hours)</span><input type="number" value={dailyTarget} onChange={(event) => setDailyTarget(event.target.value)} placeholder="2" /></label>
              <label className="form-field"><span>Weekly study target (hours)</span><input type="number" value={weeklyTarget} onChange={(event) => setWeeklyTarget(event.target.value)} placeholder="14" /></label>
            </div>
            <p className="helper-text mt8">Leave a target empty and we'll use 2 hours a day and 14 hours a week.</p>
            <div className="modal-actions mt16">
              <button className="icon-button" onClick={() => setStep(3)}>Back</button>
              <button className="primary-button" onClick={() => setStep(5)}>Continue</button>
            </div>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h2>Your study system is ready.</h2>
            <p>Here's what you've set up so far.</p>
            <div className="summary-grid">
              <div className="stat-card"><span>Subjects</span><strong>{draftSubjects.length}</strong></div>
              <div className="stat-card"><span>Upcoming exams</span><strong>{examsCount}</strong></div>
              <div className="stat-card"><span>Assignments</span><strong>{assignmentsCount}</strong></div>
              <div className="stat-card"><span>Goals</span><strong>{goalsCount}</strong></div>
            </div>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <div className="modal-actions mt16">
              <button className="icon-button" onClick={() => setStep(4)}>Back</button>
              <button className="primary-button" onClick={finish} disabled={saving}>{saving ? "Setting up…" : "Go to Dashboard"}</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
