import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const navLinkClass =
  "px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors";

export default function Layout({ children }) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm flex-shrink-0">
                AR
              </span>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">
                  AlgoRecall
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Practice patterns with spaced repetition
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <nav className="flex gap-1 sm:gap-2 text-slate-700">
                <NavLink
                  to="/review"
                  className={({ isActive }) =>
                    `${navLinkClass} ${
                      isActive ? "bg-slate-900 text-white" : "text-slate-700"
                    }`
                  }
                >
                  Review
                </NavLink>
                <NavLink
                  to="/problems"
                  className={({ isActive }) =>
                    `${navLinkClass} ${
                      isActive ? "bg-slate-900 text-white" : "text-slate-700"
                    }`
                  }
                >
                  Problem Library
                </NavLink>
              </nav>
              {user && (
                <div className="flex items-center gap-1 sm:gap-2 ml-auto sm:ml-0">
                  <span className="text-xs text-slate-600 hidden sm:inline">
                    <span className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-none inline-block">{user.email}</span>
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md px-2 py-1 whitespace-nowrap flex-shrink-0"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}


