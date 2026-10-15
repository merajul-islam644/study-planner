import { useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "./navigation";
import { useOwnerId, useProfile } from "../../features/data/store";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";

// A signed-in student who has not finished onboarding is sent to the wizard
// before any other page renders. Once finished, the wizard is not shown again.
export function OnboardingGate({ children }: { children: ReactNode }) {
  const ownerId = useOwnerId();
  const profile = useProfile();
  const navigate = useNavigate();

  // Wait until we know who the student is *and* the profile lookup has
  // settled, so a returning student is never bounced to onboarding while
  // their profile is still loading.
  const settled = Boolean(ownerId) && profile.isFetched;

  useEffect(() => {
    if (!settled) return;
    if (!profile.data || profile.data.onboarded === false) {
      navigate("/onboarding");
    }
  }, [settled, profile.data, navigate]);

  if (!settled) return <LoadingScreen />;
  return <>{children}</>;
}
