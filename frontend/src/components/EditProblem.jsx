import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function EditProblem() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [algorithmSteps, setAlgorithmSteps] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("");
  const [spaceComplexity, setSpaceComplexity] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/problems/${id}`);
        const p = res.data;
        setTitle(p.title || "");
        setUrl(p.url || "");
        setDifficulty(p.difficulty || "");
        setTags(Array.isArray(p.tags) ? p.tags.join(", ") : "");
        setNotes(p.notes || "");
        setAlgorithmSteps(p.algorithm_steps || "");
        setTimeComplexity(p.time_complexity || "");
        setSpaceComplexity(p.space_complexity || "");
        setCodeSnippet(p.code_snippet || "");
        setLoaded(true);
      } catch {
        setError("Could not load problem.");
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const parsedTags =
      tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean) || undefined;

    const payload = {
      title: title.trim(),
      url: url.trim() || undefined,
      difficulty: difficulty || undefined,
      notes: notes || undefined,
      algorithm_steps: algorithmSteps || undefined,
      time_complexity: timeComplexity || undefined,
      space_complexity: spaceComplexity || undefined,
      code_snippet: codeSnippet || undefined,
      tags: parsedTags,
    };

    try {
      setSaving(true);
      await api.put(`/problems/${id}`, payload);
      navigate("/problems");
    } catch {
      setError("Failed to update problem. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded && !error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Edit Problem</h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm text-sm text-slate-500">
          Loading problem...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Edit Problem</h2>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Edit Problem</h2>
          <p className="text-sm text-slate-500">
            Update notes, algorithm steps, and other details for this problem.
          </p>
        </div>
        <button
          onClick={() => navigate("/problems")}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Back to Library
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Problem Title<span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 15. 3Sum"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  LeetCode URL
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://leetcode.com/problems/..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Pattern Tags
                </label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Two Pointers, Sliding Window, Hash Map..."
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Your Notes
                </label>
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="High‑level idea, invariants, pitfalls, and what future‑you should remember..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Algorithm Steps
                </label>
                <textarea
                  rows={6}
                  value={algorithmSteps}
                  onChange={(e) => setAlgorithmSteps(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1. Sort the array\n2. Use two pointers...\n3. Avoid duplicates..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Time Complexity
                  </label>
                  <input
                    value={timeComplexity}
                    onChange={(e) => setTimeComplexity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="O(n log n)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Space Complexity
                  </label>
                  <input
                    value={spaceComplexity}
                    onChange={(e) => setSpaceComplexity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="O(1)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Code Snippet (optional)
                </label>
                <textarea
                  rows={10}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="mt-1 w-full font-mono rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="// Paste your final solution here for quick recall..."
                />
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-[11px] text-slate-400">
              You can keep refining your notes over time as you revisit this
              problem.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/problems")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


