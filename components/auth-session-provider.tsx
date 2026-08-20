"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  accountProfileFromUser, emptyAccountProfile, mergeAccountProfile, type AccountProfile,
} from "@/lib/account-profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { profileService } from "@/lib/supabase/profile";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthSessionContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: AccountProfile;
  profileLoading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  updateCachedProfile: (profile: AccountProfile) => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured() ? "loading" : "unauthenticated");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile>(emptyAccountProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const profileOwnerRef = useRef<string | null>(null);
  const profileRequestRef = useRef(0);

  const applySession = useCallback((nextSession: Session | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");

    const nextUser = nextSession?.user ?? null;
    if (!nextUser) {
      profileOwnerRef.current = null;
      setProfile({ ...emptyAccountProfile });
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    const identityProfile = accountProfileFromUser(nextUser);
    setProfile((current) => profileOwnerRef.current === nextUser.id
      ? {
          ...current,
          email: identityProfile.email || current.email,
          fullName: current.fullName || identityProfile.fullName,
          country: current.country || identityProfile.country,
          contactNumber: current.contactNumber || identityProfile.contactNumber,
        }
      : identityProfile);
    profileOwnerRef.current = nextUser.id;
  }, []);

  const refreshProfile = useCallback(async () => {
    const user = sessionRef.current?.user;
    if (!user) return;
    const requestId = ++profileRequestRef.current;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await profileService.get();
      if (requestId !== profileRequestRef.current || sessionRef.current?.user.id !== user.id) return;
      setProfile(mergeAccountProfile(user, response));
    } catch (error: unknown) {
      if (requestId !== profileRequestRef.current || sessionRef.current?.user.id !== user.id) return;
      setProfileError(error instanceof Error ? error.message : "Could not load your saved account details");
    } finally {
      if (requestId === profileRequestRef.current && sessionRef.current?.user.id === user.id) {
        setProfileLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      applySession(error ? null : data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) applySession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    void refreshProfile();
  }, [refreshProfile, userId]);

  const value = useMemo<AuthSessionContextValue>(() => ({
    status,
    session,
    user: session?.user ?? null,
    profile,
    profileLoading,
    profileError,
    refreshProfile,
    updateCachedProfile: setProfile,
  }), [profile, profileError, profileLoading, refreshProfile, session, status]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return context;
}
