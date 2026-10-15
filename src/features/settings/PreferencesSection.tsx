import { useEffect, useState } from "react";
import { Alert } from "../../shared/ui/Alert";
import { useProfile, useProfileMutations } from "../data/store";

// Study preferences: daily target, weekly target, preferred hours and the
// default session length. Empty targets fall back to 2 hours a day and 14
// hours a week.
export function PreferencesSection() {
  const profile = useProfile();
  const mutations = useProfileMutations();
  const [daily, setDaily] = useState("");
  const [weekly, setWeekly] = useState("");
  const [hours, setHours] = useState("");
  const [session, setSession] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setDaily(String(Math.round((profile.data.dailyTargetMinutes || 120) / 60)));
    setWeekly(String(Math.round((profile.data.weeklyTargetMinutes || 840) / 60)));
    setHours(profile.data.preferredHours ?? "");
    setSession(String(profile.data.avgSessionMinutes || 60));
  }, [profile.data]);

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Study preferences</h3>
        <p>Your targets and how you like to study.</p>
      </div>
      <form className="field-grid" onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        mutations.save.mutate({
          dailyTargetMinutes: daily ? Number(daily) * 60 : 120,
          weeklyTargetMinutes: weekly ? Number(weekly) * 60 : 840,
          preferredHours: hours,
          avgSessionMinutes: session ? Number(session) : 60
        }, { onSuccess: () => setSaved(true) });
      }}>
        <label className="form-field"><span>Daily study target (hours)</span><input type="number" min={0} value={daily} onChange={(event) => { setDaily(event.target.value); setSaved(false); }} /></label>
        <label className="form-field"><span>Weekly study target (hours)</span><input type="number" min={0} value={weekly} onChange={(event) => { setWeekly(event.target.value); setSaved(false); }} /></label>
        <label className="form-field"><span>Preferred study hours</span><input value={hours} onChange={(event) => { setHours(event.target.value); setSaved(false); }} placeholder="18:00 – 21:00" /></label>
        <label className="form-field"><span>Default session length (minutes)</span><input type="number" min={5} value={session} onChange={(event) => { setSession(event.target.value); setSaved(false); }} /></label>
        <div className="form-actions"><button className="primary-button" type="submit" disabled={mutations.save.isPending}>{mutations.save.isPending ? "Saving…" : "Save preferences"}</button></div>
      </form>
      <p className="helper-text">Leave a target empty and we'll use 2 hours a day and 14 hours a week.</p>
      {saved ? <Alert tone="info">Preferences saved.</Alert> : null}
    </div>
  );
}
