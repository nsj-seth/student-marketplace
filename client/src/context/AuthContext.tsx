import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleState, setRoleState] = useState<{ userId: string | null; roles: AppRole[] }>({ userId: null, roles: [] });
  const roleRequest = useRef(0);
  const userId = session?.user.id ?? null;

  const loadRoles = useCallback(async (id: string | null) => {
    const request = ++roleRequest.current;
    if (!id) {
      setRoleState({ userId: null, roles: [] });
      return;
    }
    let roles: AppRole[] = [];
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await getMyRoles(controller.signal);
      roles = response.data?.roles ?? [];
    } catch {
      // Fail closed: the backend remains the authority for all roles.
    } finally {
      window.clearTimeout(timeout);
    }
    if (request === roleRequest.current) setRoleState({ userId: id, roles });
  }, []);

  useEffect(() => {
    let mounted = true;
    let receivedEvent = false;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      receivedEvent = true;
      // Only publish session state while the SDK may hold its session lock.
      // The separate role effect makes API calls after this callback returns.
      setSession(nextSession);
      setSessionLoading(false);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted || receivedEvent) return;
      setSession(error ? null : data.session);
      setSessionLoading(false);
    }).catch(() => {
      if (!mounted || receivedEvent) return;
      setSession(null);
      setSessionLoading(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void loadRoles(userId);
    return () => { roleRequest.current += 1; };
  }, [userId, loadRoles]);

  const refreshRoles = useCallback(() => loadRoles(userId), [loadRoles, userId]);
  const value = useMemo(() => {
    const roles = roleState.userId === userId ? roleState.roles : [];
    return {
      session,
      user: session?.user ?? null,
      roles,
      loading: sessionLoading || roleState.userId !== userId,
      refreshRoles,
      hasRole: (role: AppRole) => roles.includes(role)
    };
  }, [session, roleState, userId, sessionLoading, refreshRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
