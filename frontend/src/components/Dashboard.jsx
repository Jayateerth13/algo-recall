export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Overview of your problem practice, streaks, and review performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Problems</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">0</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Review Streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">0 days</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Success Rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">0%</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Ready to review?
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Once you start adding problems and reviewing them, cards due today
            will appear here.
          </p>
        </div>
        <button className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600">
          Start Review
        </button>
      </div>
    </div>
  );
}


