import { NavLink } from "react-router-dom";

const navLinkClass =
  "px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 transition-colors";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
              LC
            </span>
            <div>
              <h1 className="text-sm font-semibold">
                LeetCode Algorithm Flashcards
              </h1>
              <p className="text-xs text-slate-500">
                Practice patterns with spaced repetition
              </p>
            </div>
          </div>
          <nav className="flex gap-2 text-slate-700">
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
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}


