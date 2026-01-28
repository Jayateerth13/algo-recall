import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Handle email verification and password recovery callbacks (tokens in URL hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashType = hashParams.get('type');
      
      // Check if this is a recovery session BEFORE processing
      const isRecovery = hashType === 'recovery';
      if (isRecovery) {
        setIsRecoverySession(true);
      }
      
      if (hashType === 'recovery' || hashType === 'signup') {
        // Supabase needs to process the token from the hash to create a session
        // The getSession() call below will automatically process the recovery token
        // and create a session if the token is valid
      }

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();
      
      // If we have a recovery token, Supabase processes it and creates a session
      // Clear the hash from URL after processing (whether successful or not)
      if (hashType === 'recovery' || hashType === 'signup') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
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

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getRedirectUrl()}/`,
    });
    return { error };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const clearRecoverySession = () => {
    setIsRecoverySession(false);
  };

  const value = {
    user,
    session,
    loading,
    isRecoverySession,
    clearRecoverySession,
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
    resetPassword,
    updatePassword,
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



