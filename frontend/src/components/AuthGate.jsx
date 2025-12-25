import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthGate({ children }) {
  const { user, loading, signIn, signUp, signInWithGoogle, resendVerificationEmail, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Clear form state when user logs out
  useEffect(() => {
    if (!user && !loading) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setInfo("");
      setMode("signin");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Check if user is logged in but email is not verified
  const isEmailVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
  
  if (user && isEmailVerified) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setInfo("");

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
        const { error: supaError } = await signUp(email, password);
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
          } else {
            setError(supaError.message);
          }
        } else {
          setInfo(
            "Account created! Please check your email inbox (and spam folder) for a verification link. Click the link to verify your account, then return here to sign in."
          );
          setMode("signin");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
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
              Sign in to see your personal flashcards & progress.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
            <p className="text-[11px] text-slate-500">
              Minimum 6 characters. Use a strong password.
            </p>
          </div>

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
              : "Create account"}
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
          {mode === "signin" ? (
            <p>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-slate-800 font-medium hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-slate-800 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "signup" && (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-600 font-medium">
                📧 Email Verification Required
              </p>
              <p className="text-[11px] text-slate-500">
                After creating your account, you'll receive a verification email. Click the link in that email to activate your account, then return here to sign in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



