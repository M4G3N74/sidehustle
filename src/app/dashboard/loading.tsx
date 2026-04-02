export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="h-4 w-20 bg-white/10 rounded" />
            </div>
            <div className="h-8 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Goal Skeleton */}
      <div className="card animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-white/10 rounded" />
          <div className="h-5 w-32 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-48 bg-white/10 rounded mb-2" />
        <div className="h-3 w-full bg-white/10 rounded mt-4" />
      </div>

      {/* Charts Skeleton */}
      <div className="dashboard-charts">
        <div className="card animate-pulse">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="h-56 bg-white/5 rounded-lg" />
        </div>
        <div className="card animate-pulse">
          <div className="h-5 w-32 bg-white/10 rounded mb-4" />
          <div className="h-56 bg-white/5 rounded-lg" />
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="card animate-pulse">
        <div className="h-5 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-lg bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                <div className="h-3 w-40 bg-white/10 rounded" />
              </div>
              <div className="h-4 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
