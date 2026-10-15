import { createContext, useContext } from "react";

// Router-agnostic navigation shared across the app so deep components
// (cards, rows, menus) can route without every parent threading a callback
// down. The AppRouter provides this; everything else consumes it.
export type Navigate = (path: string) => void;

const NavigationContext = createContext<Navigate | undefined>(undefined);

export const NavigationProvider = NavigationContext.Provider;

export function useNavigate(): Navigate {
  const navigate = useContext(NavigationContext);
  if (!navigate) throw new Error("useNavigate must be used within the app router");
  return navigate;
}
