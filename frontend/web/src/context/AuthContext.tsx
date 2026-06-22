import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { api, type ApiUser } from "../api";

type AuthContextValue = {
  user: ApiUser | null;
  isBootstrapping: boolean;
  setUser: (user: ApiUser | null) => void;
  refreshUser: () => Promise<ApiUser | null>;
  logout: () => Promise<void>;
  needsOnboarding: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const needsOnboarding =
    (user?.role === "musician" && !user.musicianProfile?.level) ||
    (user?.role === "label" && !user.labelProfile?.onboardedAt);

  const refreshUser = useCallback(async () => {
    try {
      const result = await api.me();
      setUser(result.user);
      return result.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {
      /* clear local state even if the session is already gone */
    });
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    void refreshUser().finally(() => {
      if (!cancelled) {
        setIsBootstrapping(false);
      }
    });

    return () => {
      cancelled = true;
    };
    // Bootstrap session once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      user,
      isBootstrapping,
      setUser,
      refreshUser,
      logout,
      needsOnboarding,
    }),
    [user, isBootstrapping, refreshUser, logout, needsOnboarding],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
