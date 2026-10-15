import { useEffect } from "react";
import { Award, Mail, RefreshCw } from "lucide-react";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { ActionButton } from "../../shared/ui/ActionButton";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useCurrentUser, userDisplayName, userInitials } from "./useCurrentUser";
import { useProfile, useProfileMutations } from "../data/store";
import { sessions } from "../data/entities";
import { computeStreak, sessionMinutes } from "../sessions/useSessions";
import { formatDuration } from "../../lib/format";

const MILESTONES = [10, 50, 100, 250];

// Reaching each milestone marks it once; achieved milestones stay on the
// profile.
export function ProfilePage() {
  const me = useCurrentUser();
  const profile = useProfile();
  const profileMutations = useProfileMutations();
  const sessionsList = sessions.useList();
  const { t } = useT();
  const user = me.data?.data;

  const allSessions = sessionsList.data ?? [];
  const totalMinutes = allSessions.reduce((total, session) => total + sessionMinutes(session), 0);
  const totalHours = totalMinutes / 60;
  const streak = computeStreak(allSessions);

  const earned = MILESTONES.filter((value) => totalHours >= value).map((value) => `${value} Hours Studied`);
  const stored = profile.data?.milestones ?? [];

  useEffect(() => {
    if (!profile.data) return;
    const missing = earned.filter((milestone) => !stored.includes(milestone));
    if (missing.length > 0) {
      profileMutations.save.mutate({ milestones: [...stored, ...missing] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earned.join(","), stored.join(","), profile.data?.ItemId]);

  return (
    <section>
      <PageHeader
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        actions={<ActionButton variant="icon" onClick={() => me.refetch()} title={t("common.refresh")} icon={<RefreshCw size={18} />} />}
      />

      {me.isLoading ? (
        <div className="profile-card">
          <Skeleton className="skeleton-avatar-lg" />
          <div className="profile-heading"><Skeleton className="skeleton-line-lg" /><Skeleton className="skeleton-line" /></div>
        </div>
      ) : (
        <div className="profile-card">
          <span className="avatar avatar-lg">{userInitials(user)}</span>
          <div className="profile-heading">
            <h3>{userDisplayName(user) || t("profile.unknownUser")}</h3>
            {user?.email ? <span className="muted"><Mail size={14} /> {user.email}</span> : null}
          </div>
        </div>
      )}

      <div className="metrics">
        <div className="metric"><span>Education level</span><strong>{profile.data?.educationLevel ?? "—"}</strong></div>
        <div className="metric"><span>Institution</span><strong>{profile.data?.institution ?? "—"}</strong></div>
        <div className="metric"><span>Term</span><strong>{profile.data?.term ?? "—"}</strong></div>
        <div className="metric"><span>Academic goal</span><strong>{profile.data?.academicGoal || "—"}</strong></div>
      </div>

      <div className="metrics">
        <div className="metric"><span>Daily target</span><strong>{formatDuration(profile.data?.dailyTargetMinutes || 120)}</strong></div>
        <div className="metric"><span>Weekly target</span><strong>{formatDuration(profile.data?.weeklyTargetMinutes || 840)}</strong></div>
        <div className="metric"><span>Total study time</span><strong>{formatDuration(totalMinutes)}</strong></div>
        <div className="metric"><span>Current streak</span><strong>{streak} {streak === 1 ? "day" : "days"}</strong></div>
      </div>

      <div className="panel">
        <div className="panel-title"><Award size={16} /> Milestones</div>
        {stored.length === 0 ? <p className="muted">No milestones yet. Reach 10 focused hours to earn your first.</p> : (
          <div className="chips">
            {stored.map((milestone) => <span key={milestone} className="chip">{milestone}</span>)}
          </div>
        )}
      </div>
    </section>
  );
}
