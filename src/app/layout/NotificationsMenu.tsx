import { Bell } from "lucide-react";
import { useNavigate } from "../router/navigation";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { useUnreadCount } from "../../features/notifications/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../shared/ui/dropdown-menu";

export function NotificationsMenu() {
  const { t } = useT();
  const navigate = useNavigate();
  const unread = useUnreadCount();
  const count = unread.data ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="icon-button notification-trigger" aria-label={`${t("nav.notifications")}${count > 0 ? `, ${count} ${t("notifications.unread")}` : ""}`}>
        <Bell size={18} />
        {count > 0 ? <span className="notification-badge">{count > 99 ? "99+" : count}</span> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[280px]">
        <DropdownMenuLabel>{t("nav.notifications")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/notifications")}>
          <Bell size={18} /> {count > 0 ? `${count} ${t("notifications.unread")}` : t("notifications.caughtUp")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
