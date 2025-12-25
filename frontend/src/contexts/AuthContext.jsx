import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Handle email verification callback (tokens in URL hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get('type') === 'recovery' || hashParams.get('type') === 'signup') {
        // Supabase will automatically handle the tokens in the hash
        // Clear the hash from URL after processing
        window.history.replaceState(null, '', window.location.pathname);
      }

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Keep axios auth token in sync with Supabase session
  useEffect(() => {
    if (session?.access_token) {
      setAuthToken(session.access_token);
    } else {
      setAuthToken(null);
    }
  }, [session]);

  const signOut = async () => {
    // Clear local state first
    setSession(null);
    setUser(null);
    setAuthToken(null);
    
    // Try to sign out from Supabase, but don't fail if session is already invalid
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      // Ignore errors - session might already be invalid/expired
      // Local state is already cleared above
      console.warn("Sign out error (ignored):", error);
    }
  };

  // Get the redirect URL from environment variable or fall back to current origin
  const getRedirectUrl = () => {
    return import.meta.env.VITE_SITE_URL || window.location.origin;
  };

  const resendVerificationEmail = async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${getRedirectUrl()}/`
      }
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp: (email, password) =>
      supabase.auth.signUp({ 
        email, 
        password, 
        options: { emailRedirectTo: `${getRedirectUrl()}/` } 
      }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ 
      provider: "google",
      options: {
        redirectTo: `${getRedirectUrl()}/`
      }
    }),
    resendVerificationEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}



