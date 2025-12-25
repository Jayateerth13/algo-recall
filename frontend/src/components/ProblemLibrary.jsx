import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ConfirmDialog from "./ConfirmDialog";

export default function ProblemLibrary() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/problems");
      setProblems(res.data || []);
    } catch (e) {
      setError("Could not load problems. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleDeleteClick = (id) => {
    setProblemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!problemToDelete) return;

    try {
      await api.delete(`/problems/${problemToDelete}`);
      await fetchProblems();
      setDeleteDialogOpen(false);
      setProblemToDelete(null);
    } catch {
      setError("Failed to delete problem. Try again.");
      setDeleteDialogOpen(false);
      setProblemToDelete(null);
    }
  };

  const filtered = problems.filter((p) => {
    const matchesSearch = p.title
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter
      ? p.difficulty === difficultyFilter
      : true;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Problem Library
          </h2>
          <p className="text-sm text-slate-600">
            Searchable list of all problems you&apos;ve added.
          </p>
        </div>
        <Link to="/problems/new">
          <button className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600">
            Add Problem
          </button>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary sm:w-64"
            placeholder="Search by title..."
          />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {loading ? (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-600">
            Loading problems...
          </div>
        ) : error ? (
          <div className="border-2 border-red-400 bg-red-100 rounded-lg p-4 text-sm text-red-800 font-medium">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-slate-600">
            No problems yet. Click <span className="font-semibold">Add Problem</span> to
            create your first one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 text-xs uppercase tracking-wide text-slate-700 font-semibold">
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Difficulty</th>
                  <th className="py-3 pr-4">Tags</th>
                  <th className="py-3 pr-4">Platform</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="py-3 pr-4">
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          {p.title}
                        </a>
                      ) : (
                        <span className="text-slate-800 font-medium">{p.title}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 capitalize text-xs">
                      <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 font-medium">
                        {p.difficulty || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-700">
                      {Array.isArray(p.tags) && p.tags.length > 0
                        ? p.tags.join(", ")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">
                      {p.platform || "leetcode"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/problems/${p.id}/edit`)}
                        className="rounded border-2 border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 mr-1"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(p.id)}
                        className="rounded border-2 border-red-400 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Problem?"
        description="This cannot be undone. All notes and review history for this problem will be permanently lost."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
}


