import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthGate({ children }) {
  const { user, session, loading, isRecoverySession, clearRecoverySession, signIn, signUp, signInWithGoogle, resendVerificationEmail, resetPassword, updatePassword, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'verify-email'
  const [signupEmail, setSignupEmail] = useState(""); // Store email for verification screen
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Check if we're in password reset mode (recovery token in URL)
  // Set mode to reset-password if we have a recovery session
  useEffect(() => {
    if (isRecoverySession && mode !== "reset-password") {
      setMode("reset-password");
    }
  }, [isRecoverySession, mode]);

  // Clear form state when user logs out
  useEffect(() => {
    if (!user && !loading) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setError("");
      setInfo("");
      // Only reset to signin if we're not in a special mode
      if (mode !== "reset-password" && mode !== "forgot-password" && mode !== "signup" && mode !== "verify-email") {
        setMode("signin");
      }
    }
  }, [user, loading, mode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Check if user is logged in but email is not verified
  const isEmailVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
  
  // If we're in reset-password mode OR have a recovery session, show password reset form
  // This prevents users from being auto-logged in when they click the recovery link
  if (mode === "reset-password" || isRecoverySession) {
    // Show password reset form - continue to render it below
  } else if (user && isEmailVerified) {
    return children;
  }

  // Show email verification screen if user is logged in but email is not verified
  if (user && !isEmailVerified) {
    const handleResendEmail = async () => {
      setResendingEmail(true);
      setError("");
      setInfo("");
      const { error: resendError } = await resendVerificationEmail(user.email);
      if (resendError) {
        setError(resendError.message || "Failed to resend verification email. Please try again.");
      } else {
        setInfo("Verification email sent! Please check your inbox (and spam folder).");
      }
      setResendingEmail(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm">
              AR
            </span>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                AlgoRecall
              </h1>
              <p className="text-xs text-slate-500">
                Email verification required
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-xs text-slate-700 space-y-2">
              <p className="font-medium text-slate-900">
                📧 Please verify your email address
              </p>
              <p>
                We've sent a verification link to <span className="font-medium text-slate-900">{user.email}</span>. 
                Please check your inbox (and spam folder) and click the link to verify your account.
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
                {error}
              </p>
            )}
            {info && (
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 space-y-1">
                <p className="font-medium">✓ {info}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resendingEmail}
                className="flex-1 inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {resendingEmail ? "Sending..." : "Resend Verification Email"}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Sign Out
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              After verifying your email, refresh this page or sign in again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show dedicated "check your email" screen after signup
  if (mode === "verify-email" && signupEmail) {
    const handleResendToNewUser = async () => {
      setResendingEmail(true);
      setError("");
      setInfo("");
      const { error: resendError } = await resendVerificationEmail(signupEmail);
      if (resendError) {
        setError(resendError.message || "Failed to resend verification email. Please try again.");
      } else {
        setInfo("Verification email sent! Please check your inbox (and spam folder).");
      }
      setResendingEmail(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-sm border border-slate-200 p-6 space-y-5">
          {/* Success Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
              <p className="text-sm text-slate-500 mt-1">We've sent a verification link to</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{signupEmail}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-slate-700 font-medium">Next steps:</p>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
              <li>Open your email inbox (check spam folder too)</li>
              <li>Click the verification link in the email</li>
              <li>Return here and sign in with your new account</li>
            </ol>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              {error}
            </p>
          )}
          {info && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              <p className="font-medium">✓ {info}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleResendToNewUser}
              disabled={resendingEmail}
              className="w-full inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {resendingEmail ? "Sending..." : "Resend verification email"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setSignupEmail("");
                setError("");
                setInfo("");
              }}
              className="w-full inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to sign in
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Used the wrong email?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setSignupEmail("");
                setError("");
                setInfo("");
              }}
              className="text-slate-700 font-medium hover:underline"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setInfo("");

    if (mode === "forgot-password") {
      if (!email) {
        setError("Email is required.");
        setSubmitting(false);
        return;
      }
      try {
        const { error: resetError } = await resetPassword(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          setInfo("Password reset email sent! Please check your inbox (and spam folder) for instructions.");
          setEmail("");
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "reset-password") {
      if (!newPassword || !confirmNewPassword) {
        setError("Both password fields are required.");
        setSubmitting(false);
        return;
      }

      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        setSubmitting(false);
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setError("Passwords do not match.");
        setSubmitting(false);
        return;
      }

      try {
        // Check if we have a session first
        if (!session) {
          setError("Session expired. Please request a new password reset link.");
          setSubmitting(false);
          return;
        }

        const { error: updateError } = await updatePassword(newPassword);
        if (updateError) {
          setError(updateError.message || "Failed to update password. The reset link may have expired.");
        } else {
          setInfo("Password updated successfully! Redirecting to sign in...");
          // Clear recovery session flag and sign out after password update
          clearRecoverySession();
          await signOut();
          setTimeout(() => {
            setMode("signin");
            setNewPassword("");
            setConfirmNewPassword("");
            setError("");
            setInfo("");
          }, 2000);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setError("Email and password are required.");
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setSubmitting(false);
        return;
      }
    }

    try {
      if (mode === "signin") {
        const { error: supaError } = await signIn(email, password);
        if (supaError) setError(supaError.message);
      } else {
        const { data, error: supaError } = await signUp(email, password);
        if (supaError) {
          // Check for duplicate email/user already exists error
          const errorMessage = supaError.message.toLowerCase();
          if (
            errorMessage.includes("already registered") ||
            errorMessage.includes("user already exists") ||
            errorMessage.includes("already exists") ||
            supaError.message.includes("User already registered")
          ) {
            setError(
              "An account with this email already exists. Please sign in instead, or use a different email address."
            );
            // Suggest switching to sign in mode
            setTimeout(() => {
              setMode("signin");
            }, 2000);
          } else if (
            errorMessage.includes("database error") ||
            errorMessage.includes("500") ||
            errorMessage.includes("internal server error")
          ) {
            setError(
              "Database error during signup. This might be due to a database trigger issue. Please check your Supabase dashboard or contact support."
            );
            console.error("Signup error details:", supaError);
          } else {
            setError(supaError.message || "Failed to create account. Please try again.");
          }
        } else {
          // Store email for verification screen and switch to verification mode
          setSignupEmail(email);
          setMode("verify-email");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
          setError("");
          setInfo("");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setInfo("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-sm">
            AR
          </span>
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              AlgoRecall
            </h1>
            <p className="text-xs text-slate-500">
              {mode === "forgot-password"
                ? "Reset your password"
                : mode === "reset-password"
                ? "Set your new password"
                : "Sign in to see your personal flashcards & progress."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Forgot Password Mode */}
          {mode === "forgot-password" && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
              <p className="text-[11px] text-slate-500">
                We'll send you a link to reset your password.
              </p>
            </div>
          )}

          {/* Reset Password Mode */}
          {mode === "reset-password" && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your new password"
                />
                <p className="text-[11px] text-slate-500">
                  Minimum 6 characters. Use a strong password.
                </p>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter your new password"
                />
              </div>
            </>
          )}

          {/* Sign In / Sign Up Mode */}
          {(mode === "signin" || mode === "signup") && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={mode === "signup" ? "Enter your password" : ""}
                />
                {mode === "signup" && (
                  <p className="text-[11px] text-slate-500">
                    Minimum 6 characters. Use a strong password.
                  </p>
                )}
              </div>
            </>
          )}

          {mode === "signup" && (
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">
                Re-enter Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password to confirm"
              />
              <p className="text-[11px] text-slate-500">
                Please re-enter your password to ensure it matches.
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
              {error}
            </p>
          )}
          {info && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 space-y-1">
              <p className="font-medium">✓ {info}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : mode === "signup"
              ? "Create account"
              : mode === "forgot-password"
              ? "Send Reset Link"
              : "Update Password"}
          </button>
        </form>

        {/* Google Auth - Commented out for now, will scale later */}
        {/* <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span>Continue with Google</span>
        </button> */}

        <div className="space-y-1 text-xs text-slate-500">
          {mode === "signin" && (
            <>
              <p>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setInfo("");
                  }}
                  className="text-slate-800 font-medium hover:underline"
                >
                  Create an account
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot-password");
                    setError("");
                    setInfo("");
                    setPassword("");
                  }}
                  className="text-slate-800 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setInfo("");
                }}
                className="text-slate-800 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot-password" && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setInfo("");
                  setEmail("");
                }}
                className="text-slate-800 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "reset-password" && (
            <p>
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                  setInfo("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                className="text-slate-800 font-medium hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-[11px] text-slate-500">
              📧 We'll send a verification email to confirm your address.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}



