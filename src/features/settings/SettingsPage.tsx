import { PageHeader } from "../../shared/ui/PageHeader";
import { AccountDetailsSection } from "./AccountDetailsSection";
import { PreferencesSection } from "./PreferencesSection";
import { NotificationPrefsSection, DataSection } from "./DataSection";
import { AppearanceSection } from "./AppearanceSection";
import { useProfile, useProfileMutations, useChangeLogs } from "../data/store";
import { formatDateTime } from "../../lib/format";
import { EmptyState } from "../../shared/ui/EmptyState";

export function SettingsPage() {
  const profile = useProfile();
  const profileMutations = useProfileMutations();
  const history = useChangeLogs();

  return (
    <section>
      <PageHeader title="Settings" subtitle="Your account, study preferences, notifications, appearance and data." />
      <div className="settings-layout">
        <AccountDetailsSection />
        <PreferencesSection />
        <NotificationPrefsSection value={profile.data?.notificationPrefs} onSave={(next) => profileMutations.save.mutate({ notificationPrefs: next })} />
        <AppearanceSection />
        <DataSection />

        <div className="settings-section">
          <div className="settings-section-header">
            <h3>Recent changes</h3>
            <p>A record of what you changed, when and what.</p>
          </div>
          {history.isLoading ? <p className="muted">Loading…</p> : (history.data ?? []).length === 0 ? (
            <EmptyState title="No changes yet" description="Changes to your subjects, sessions and goals are recorded here." />
          ) : (
            <div className="list-stack">
              {(history.data ?? []).slice(0, 12).map((entry) => (
                <div key={entry.ItemId ?? entry.itemId} className="list-row">
                  <div className="list-row-main">
                    <strong>{entry.summary ?? entry.action} · {entry.entityName}</strong>
                    <span className="muted">{entry.actorName ?? "You"}{entry.createdDate ? ` · ${formatDateTime(entry.createdDate)}` : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
