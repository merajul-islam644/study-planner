import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNavigate } from "../../app/router/navigation";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/EmptyState";
import { Skeleton } from "../../shared/ui/Skeleton";
import { useToast } from "../../shared/ui/toast";
import { formatDateTime } from "../../lib/format";
import { useNotificationsList, useNotificationMutations } from "./useNotifications";
import { useNotificationDispatch } from "./useNotificationDispatch";

export function NotificationsPage() {
  // Opening the inbox is what raises any due notifications from records.
  useNotificationDispatch();
  const navigate = useNavigate();
  const list = useNotificationsList();
  const { markRead, markAllRead, remove } = useNotificationMutations();
  const { show } = useToast();

  const items = [...(list.data ?? [])].sort((a, b) => (b.createdDate ?? "").localeCompare(a.createdDate ?? ""));
  const unread = items.filter((entry) => !entry.read).length;

  function openNotification(entry: (typeof items)[number]) {
    if (!entry.read) markRead.mutate(entry);
    if (entry.link?.startsWith("/")) navigate(entry.link);
  }

  return (
    <section>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."}
        actions={<button className="ghost-button" onClick={() => markAllRead.mutate()} disabled={unread === 0}><CheckCheck size={16} /> Mark all read</button>}
      />

      {list.isLoading ? (
        <Skeleton className="skeleton-block" />
      ) : items.length === 0 ? (
        <EmptyState icon={<Bell size={26} />} title="No notifications" description="Reminders about your sessions, assignments, exams and goals appear here." />
      ) : (
        <div className="list-stack">
          {items.map((entry) => (
            <div key={entry.ItemId ?? entry.itemId} className="list-row">
              <button className="list-row-main" style={{ textAlign: "left", flex: 1 }} onClick={() => openNotification(entry)}>
                <strong>{!entry.read ? "● " : ""}{entry.topic ?? "Notification"}</strong>
                <span className="muted">{entry.message}</span>
                {entry.createdDate ? <small className="muted">{formatDateTime(entry.createdDate)}</small> : null}
              </button>
              <div className="row">
                {!entry.read ? <button className="ghost-button" onClick={() => markRead.mutate(entry)}>Mark read</button> : null}
                <button className="icon-button" title="Delete" onClick={() => { remove.mutate(entry); show("Notification deleted.", "success"); }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
