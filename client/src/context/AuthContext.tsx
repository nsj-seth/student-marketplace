import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { supabase } from "../lib/supabase";
import { getMyRoles, type AppRole } from "../services/role.service";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  refreshRoles: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (nextSession: Session | null) => {
    if (!nextSession) {
      setRoles([]);
      return;
    }

    try {
      const response = await getMyRoles();
      setRoles(response.data?.roles ?? []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadRoles(data.session);
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadRoles(nextSession).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadRoles]);

  const refreshRoles = useCallback(async () => {
    await loadRoles(session);
  }, [loadRoles, session]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      roles,
      loading,
      refreshRoles,
      hasRole: (role: AppRole) => roles.includes(role)
    }),
    [session, roles, loading, refreshRoles]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
