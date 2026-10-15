import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../../lib/theme";
import type { Appearance } from "../../lib/theme";
import { useT } from "../../lib/i18n/LocalizationProvider";
import type { TranslationKey } from "../../lib/i18n/dictionary";

const OPTIONS: { value: Appearance; labelKey: TranslationKey; icon: typeof Sun }[] = [
  { value: "light", labelKey: "settings.appearanceLight", icon: Sun },
  { value: "dark", labelKey: "settings.appearanceDark", icon: Moon },
  { value: "system", labelKey: "settings.appearanceSystem", icon: Monitor }
];

export function AppearanceSection() {
  const { appearance, setAppearance } = useTheme();
  const { t } = useT();

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>{t("settings.sectionAppearance")}</h3>
        <p>{t("settings.sectionAppearanceHint")}</p>
      </div>

      <div className="segmented" role="radiogroup" aria-label={t("settings.sectionAppearance")}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={appearance === option.value}
            className={appearance === option.value ? "active" : ""}
            onClick={() => setAppearance(option.value)}
          >
            <option.icon size={16} /> {t(option.labelKey)}
          </button>
        ))}
      </div>
      <p className="muted">{t("settings.appearanceSystemHint")}</p>
    </div>
  );
}
