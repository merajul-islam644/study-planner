import { BookOpenCheck, MoreHorizontal, PanelLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { mobileMoreItems, mobileNavItems, matchesNavItem, navItems } from "./navItems";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserMenu } from "./UserMenu";
import { useNotificationDispatch } from "../../features/notifications/useNotificationDispatch";
import { useT } from "../../lib/i18n/LocalizationProvider";

const COLLAPSED_KEY = "study-planner:sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 880px)";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

export function AppShell({ activePath, children, onNavigate }: { activePath: string; children: ReactNode; onNavigate: (path: string) => void }) {
  const isMobile = useIsMobile();
  const [collapsedPref, setCollapsedPref] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "true");
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useT();
  const collapsed = collapsedPref || isMobile;
  const activeItem = navItems.find((item) => matchesNavItem(item.href, activePath));
  useNotificationDispatch();

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsedPref));
  }, [collapsedPref]);

  useEffect(() => {
    setMoreOpen(false);
  }, [activePath]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="shell">
      <aside className={collapsed ? "collapsed" : ""}>
        <div className="sidebar-header">
          {collapsed ? null : (
            <a className="brand" href="/dashboard" onClick={(event) => { event.preventDefault(); onNavigate("/dashboard"); }}>
              <span className="brand-mark"><BookOpenCheck size={16} /></span>
              <span>{t("app.name")}</span>
            </a>
          )}
          <button className="icon-button sidebar-collapse-toggle" onClick={() => setCollapsedPref((value) => !value)} aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}>
            <PanelLeft size={16} />
          </button>
        </div>
        <nav aria-label={t("shell.primaryNav")}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-tooltip={t(item.labelKey)}
              className={matchesNavItem(item.href, activePath) ? "active" : ""}
              aria-current={matchesNavItem(item.href, activePath) ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.href);
              }}
            >
              <item.icon size={18} />
              {collapsed ? null : <span>{t(item.labelKey)}</span>}
            </a>
          ))}
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          {activeItem ? (
            <div className="breadcrumb">
              <activeItem.icon size={16} />
              <span>{t(activeItem.labelKey)}</span>
            </div>
          ) : null}
          <span className="topbar-date">{today}</span>
          <div className="topbar-spacer" />
          <button className="icon-button search-trigger" onClick={() => onNavigate("/search")} aria-label={t("nav.search")}>
            <Search size={18} />
          </button>
          <LanguageSwitcher />
          <NotificationsMenu />
          <UserMenu onNavigate={onNavigate} />
        </header>
        <main>{children}</main>
      </div>

      <nav className="bottom-nav" aria-label={t("shell.primaryNav")}>
        {mobileNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={matchesNavItem(item.href, activePath) ? "active" : ""}
            aria-current={matchesNavItem(item.href, activePath) ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.href);
            }}
          >
            <item.icon size={20} />
            <span>{t(item.labelKey)}</span>
          </a>
        ))}
        <button
          type="button"
          className={moreOpen ? "active" : ""}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((value) => !value)}
        >
          <MoreHorizontal size={20} />
          <span>{t("nav.more")}</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="more-sheet-backdrop" role="presentation" onClick={() => setMoreOpen(false)}>
          <div className="more-sheet" role="menu" aria-label={t("nav.more")} onClick={(event) => event.stopPropagation()}>
            {mobileMoreItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                role="menuitem"
                className={matchesNavItem(item.href, activePath) ? "active" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  setMoreOpen(false);
                  onNavigate(item.href);
                }}
              >
                <item.icon size={18} />
                <span>{t(item.labelKey)}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
