"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { AuthProfile } from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  profile: AuthProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const isLoginRoute = pathname?.startsWith("/login");

  async function loadProfile(currentSession: Session | null) {
    if (!currentSession) {
      setProfile(null);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
        signal: controller.signal,
      });
      if (!response.ok) {
        setProfile(null);
        return;
      }
      const payload = await response.json();
      setProfile(payload.data);
    } catch {
      setProfile(null);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;
    async function initializeAuth() {
      try {
        const client = await getSupabaseBrowserClient();
        if (!active) return;
        const { data } = await client.auth.getSession();
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        await loadProfile(data.session);
        if (!data.session && !isLoginRoute) router.replace("/login");
        if (data.session && isLoginRoute) router.replace("/");
        const { data: listener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
          setLoading(true);
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          await loadProfile(nextSession);
          setLoading(false);
          if (!nextSession && !isLoginRoute) router.replace("/login");
          if (nextSession && isLoginRoute) router.replace("/");
        });
        subscription = listener.subscription;
      } catch {
        if (!isLoginRoute) router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    }
    initializeAuth();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [isLoginRoute, router]);

  async function signOut() {
    const supabase = await getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    router.replace("/login");
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile: () => loadProfile(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
