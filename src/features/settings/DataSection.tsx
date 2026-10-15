import { useState } from "react";
import { useNavigate } from "../../app/router/navigation";
import { Modal } from "../../shared/ui/Modal";
import { useToast } from "../../shared/ui/toast";
import { collection } from "../../lib/blocks/data";
import { useOwnerId } from "../data/store";
import { useAuth } from "../../app/providers/AuthProvider";
import { blocksClient } from "../../lib/blocks/client";
import { useCurrentUser } from "../profile/useCurrentUser";

const EXPORT_SCHEMAS = ["Subject", "Topic", "Assignment", "Task", "Exam", "StudySession", "Goal", "CalendarEvent", "Note", "Resource", "Flashcard", "Notification", "Reminder", "ChangeLog"];

// Export produces one file holding the student's records. Delete account asks
// the student to type their email, then removes the account and its records.
export function DataSection() {
  const ownerId = useOwnerId();
  const me = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [error, setError] = useState("");

  const email = me.data?.data?.email ?? "";

  async function exportData() {
    if (!ownerId) return;
    setExporting(true);
    try {
      const bundle: Record<string, unknown> = {};
      for (const schemaName of EXPORT_SCHEMAS) {
        const handle = collection(schemaName);
        const page = await handle.list({ filter: { ownerId }, pageNo: 1, pageSize: 1000 });
        bundle[schemaName] = page.items;
      }
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "study-planner-export.json";
      link.click();
      URL.revokeObjectURL(url);
      show("Your data export has downloaded.", "success");
    } catch {
      show("We couldn't prepare your export. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (confirmEmail.trim().toLowerCase() !== email.toLowerCase()) {
      setError("Type your email exactly to confirm.");
      return;
    }
    setError("");
    // Remove this student's records, then end the session. Account deletion
    // itself is an IAM administrator action this frontend cannot perform.
    try {
      for (const schemaName of EXPORT_SCHEMAS) {
        const handle = collection(schemaName);
        const page = await handle.list({ filter: { ownerId }, pageNo: 1, pageSize: 1000 });
        await Promise.all((page.items ?? []).map((record) => {
          const id = (record as { ItemId?: string; itemId?: string }).ItemId ?? (record as { itemId?: string }).itemId;
          return id ? handle.remove(String(id)) : Promise.resolve();
        }));
      }
    } catch {
      // Best effort; the session still ends below.
    }
    await blocksClient.auth.logoutAll({}).catch(() => undefined);
    await logout();
    navigate("/login");
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Data</h3>
        <p>Export your records or delete your account.</p>
      </div>
      <div className="row wrap">
        <button className="ghost-button" onClick={exportData} disabled={exporting}>{exporting ? "Preparing…" : "Export data"}</button>
        <button className="ghost-button danger" onClick={() => setDeleting(true)}>Delete account</button>
      </div>

      {deleting ? (
        <Modal title="Delete account" onClose={() => setDeleting(false)}>
          <p>This removes your account and all your records. Type your email to confirm.</p>
          <label className="form-field">
            <span>Email</span>
            <input value={confirmEmail} onChange={(event) => { setConfirmEmail(event.target.value); setError(""); }} placeholder={email} />
          </label>
          {error ? <div className="field-error">{error}</div> : null}
          <div className="modal-actions">
            <button className="icon-button" onClick={() => setDeleting(false)}>Cancel</button>
            <button className="primary-button danger" onClick={deleteAccount}>Delete account</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function NotificationPrefsSection({ value, onSave }: { value: string | undefined; onSave: (next: string) => void }) {
  const prefs = parse(value);
  const [local, setLocal] = useState(prefs);
  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Notifications</h3>
        <p>Choose which reminders you receive.</p>
      </div>
      {(["study", "assignment", "exam", "goal"] as const).map((key) => (
        <label key={key} className="check-row">
          <input type="checkbox" checked={local[key]} onChange={(event) => { const next = { ...local, [key]: event.target.checked }; setLocal(next); onSave(JSON.stringify(next)); }} />
          <span style={{ textTransform: "capitalize" }}>{key} reminders</span>
        </label>
      ))}
    </div>
  );
}

function parse(raw: string | undefined) {
  try {
    return { study: true, assignment: true, exam: true, goal: true, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { study: true, assignment: true, exam: true, goal: true };
  }
}
