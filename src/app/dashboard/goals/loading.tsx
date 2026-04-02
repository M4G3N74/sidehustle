export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-6 w-20 bg-white/10 rounded" />
      </div>

      <div className="card animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-white/10 rounded" />
          <div className="h-5 w-32 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-40 bg-white/10 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/10 rounded-lg" />
        </div>
      </div>

      <div className="card p-5 animate-pulse">
        <div className="h-5 w-24 bg-white/10 rounded mb-4" />
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-12 bg-white/10 rounded-lg" />
          <div className="h-12 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
