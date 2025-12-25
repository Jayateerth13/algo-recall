import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ConfirmDialog from "./ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export default function FlashcardReview() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [days, setDays] = useState(30);
  const [perDay, setPerDay] = useState(5);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Per-session review status: problemId -> "remembered" | "forgot"
  const [statusById, setStatusById] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  // Dialog states
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [resetDayDialogOpen, setResetDayDialogOpen] = useState(false);
  const [dayToReset, setDayToReset] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reviews/due");
        const items = res.data || [];
        setProblems(items);
        const statusMap = {};
        items.forEach((p) => {
          if (p.review_status === 1) statusMap[p.id] = "remembered";
          else if (p.review_status === -1) statusMap[p.id] = "forgot";
        });
        setStatusById(statusMap);
      } catch (e) {
        setError("Could not load problems for review. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const schedule = useMemo(() => {
    if (!problems.length || !days || !perDay) return [];

    const totalSlots = days * perDay;
    let pool = [...problems];

    if (shuffleMode) {
      // Simple in-place Fisher–Yates shuffle
      for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    const used = pool.slice(0, totalSlots);

    const result = [];
    for (let day = 0; day < days; day += 1) {
      const start = day * perDay;
      const end = start + perDay;
      result.push({
        day: day + 1,
        problems: used.slice(start, end),
      });
    }

    return result;
  }, [problems, days, perDay, shuffleMode, shuffleSeed]);

  const selectedProblem =
    selectedId != null
      ? problems.find((p) => p.id === selectedId) || null
      : null;

  const markStatus = async (problemId, result) => {
    setStatusById((prev) => ({ ...prev, [problemId]: result }));
    try {
      await api.post("/reviews", {
        problem_id: problemId,
        result,
      });
    } catch {
      // Keep UI optimistic; we can surface a toast later if needed.
    }
  };

  const handleShuffleClick = () => {
    setShuffleMode(true);
    setShuffleSeed((s) => s + 1);
  };

  const handleDefaultOrder = () => {
    setShuffleMode(false);
    setShuffleSeed((s) => s + 1);
  };

  const handleResetAllClick = () => {
    setResetAllDialogOpen(true);
  };

  const handleResetAllConfirm = async () => {
    try {
      await Promise.all(
        problems.map((p) => api.put(`/reviews/${p.id}/reset`))
      );
      setStatusById({});
      setSelectedId(null);
      setResetAllDialogOpen(false);
    } catch {
      setError("Failed to reset reviews. Try again.");
      setResetAllDialogOpen(false);
    }
  };

  const resetProblem = async (problemId) => {
    try {
      await api.put(`/reviews/${problemId}/reset`);
      setStatusById((prev) => {
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
      if (selectedId === problemId) {
        // keep overlay open but now un-colored; details still visible
      }
    } catch {
      setError("Failed to reset this problem. Try again.");
    }
  };

  const resetDayClick = (dayProblems) => {
    setDayToReset(dayProblems);
    setResetDayDialogOpen(true);
  };

  const resetDayConfirm = async () => {
    if (!dayToReset) return;

    try {
      await Promise.all(
        dayToReset.map((p) => api.put(`/reviews/${p.id}/reset`))
      );
      setStatusById((prev) => {
        const next = { ...prev };
        for (const p of dayToReset) {
          delete next[p.id];
        }
        return next;
      });
      setResetDayDialogOpen(false);
      setDayToReset(null);
    } catch {
      setError("Failed to reset this day. Try again.");
      setResetDayDialogOpen(false);
      setDayToReset(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Flashcard Review
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-base text-slate-500">
          Loading problems...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Flashcard Review
        </h2>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-base text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!problems.length) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Flashcard Review
        </h2>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 text-base text-slate-500 text-center">
          No problems in your library yet. Add some problems first.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Flashcard Review
          </h2>
          <p className="text-sm text-slate-500">
            Compact 30-day style sheet; click any problem to see
            full details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-emerald-200" />{" "}
            <span>Remembered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-red-200" />{" "}
            <span>Didn&apos;t remember</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-white border border-slate-200" />{" "}
            <span>Not reviewed yet</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-base">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Days
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) =>
                setDays(
                  Math.max(1, Math.min(60, Number(e.target.value) || 1))
                )
              }
              className="mt-1 w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">
              Problems / day
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={perDay}
              onChange={(e) =>
                setPerDay(
                  Math.max(1, Math.min(20, Number(e.target.value) || 1))
                )
              }
              className="mt-1 w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDefaultOrder}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              !shuffleMode
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>≡</span>
            <span>Default</span>
          </button>
          <button
            type="button"
            onClick={handleShuffleClick}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              shuffleMode
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>🔀</span>
            <span>Shuffle</span>
          </button>
          <button
            type="button"
            onClick={handleResetAllClick}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {schedule.map((dayBlock) => (
            <div
              key={dayBlock.day}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">
                  Day {dayBlock.day}
                </span>
                <span className="flex items-center gap-2">
                  {dayBlock.problems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => resetDayClick(dayBlock.problems)}
                      className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                      title="Reset this day"
                    >
                      ⟳
                    </button>
                  )}
                </span>
              </div>
              {dayBlock.problems.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No problem assigned for this slot.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {dayBlock.problems.map((p) => {
                    const status = statusById[p.id];
                    const base =
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm cursor-pointer";
                    const colorClasses =
                      status === "remembered"
                        ? "bg-emerald-50 border-emerald-200"
                        : status === "forgot"
                        ? "bg-red-50 border-red-200"
                        : "bg-white border-slate-200 hover:bg-slate-50";

                    return (
                      <li
                        key={p.id}
                        className={`${base} ${colorClasses} cursor-pointer`}
                        onClick={() => setSelectedId(p.id)}
                      >
                        <span className="truncate text-slate-800">
                          {p.title}
                        </span>
                        <span className="flex gap-1 items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markStatus(p.id, "remembered");
                            }}
                            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markStatus(p.id, "forgot");
                            }}
                            className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-100"
                          >
                            ×
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              resetProblem(p.id);
                            }}
                            className="rounded px-1 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                            title="Reset this problem"
                          >
                            ⟳
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedProblem} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          {selectedProblem && (
            <>
              <DialogHeader className="pr-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <DialogTitle className="text-lg font-semibold text-slate-900">
                      {selectedProblem.title}
                    </DialogTitle>
                    {selectedProblem.url && (
                      <a
                        href={selectedProblem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-primary hover:underline"
                      >
                        Open on LeetCode
                      </a>
                    )}
                  </div>
                  <Link
                    to={`/problems/${selectedProblem.id}/edit`}
                    className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
                  >
                    Edit
                  </Link>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-sm text-slate-700">
                {selectedProblem.notes ? (
                  <div>
                    <p className="font-medium text-slate-800 mb-1.5">Notes</p>
                    <p className="whitespace-pre-line text-slate-600 max-h-48 overflow-auto rounded-md bg-slate-50 p-3 border border-slate-200">
                      {selectedProblem.notes}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-slate-400 text-xs">No notes added yet</p>
                  </div>
                )}

                {selectedProblem.algorithm_steps ? (
                  <div>
                    <p className="font-medium text-slate-800 mb-1.5">
                      Algorithm Steps
                    </p>
                    <p className="whitespace-pre-line text-slate-600 max-h-48 overflow-auto rounded-md bg-slate-50 p-3 border border-slate-200">
                      {selectedProblem.algorithm_steps}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-slate-400 text-xs">No algorithm steps added yet</p>
                  </div>
                )}

                {(selectedProblem.time_complexity ||
                  selectedProblem.space_complexity) ? (
                  <div className="flex gap-4 text-slate-600">
                    {selectedProblem.time_complexity && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Time:</span>
                        <span>{selectedProblem.time_complexity}</span>
                      </div>
                    )}
                    {selectedProblem.space_complexity && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Space:</span>
                        <span>{selectedProblem.space_complexity}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-slate-400 text-xs">No complexity analysis added yet</p>
                  </div>
                )}

                {selectedProblem.code_snippet ? (
                  <div>
                    <p className="font-medium text-slate-800 mb-1.5">
                      Code Snippet
                    </p>
                    <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-4 text-xs text-slate-100 border border-slate-700">
                      {selectedProblem.code_snippet}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-md bg-slate-50 border border-slate-200 p-4 text-center">
                    <p className="text-slate-400 text-xs">No code snippet added yet</p>
                  </div>
                )}

                <div className="pt-3 flex gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => markStatus(selectedProblem.id, "remembered")}
                    className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    Mark remembered
                  </button>
                  <button
                    type="button"
                    onClick={() => markStatus(selectedProblem.id, "forgot")}
                    className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Mark not remembered
                  </button>
                  <button
                    type="button"
                    onClick={() => resetProblem(selectedProblem.id)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={resetAllDialogOpen}
        onOpenChange={setResetAllDialogOpen}
        title="Reset All Reviews?"
        description="This will clear review history for all problems. All remembered/not remembered selections will be reset."
        confirmText="Reset All"
        cancelText="Cancel"
        onConfirm={handleResetAllConfirm}
        variant="destructive"
      />

      <ConfirmDialog
        open={resetDayDialogOpen}
        onOpenChange={setResetDayDialogOpen}
        title="Reset Day Reviews?"
        description="This will clear review history for all problems in this day. All remembered/not remembered selections for these problems will be reset."
        confirmText="Reset Day"
        cancelText="Cancel"
        onConfirm={resetDayConfirm}
        variant="destructive"
      />
    </div>
  );
}

