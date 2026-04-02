export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-6 w-20 bg-white/10 rounded" />
      </div>

      <div className="space-y-5">
        <div className="card animate-pulse">
          <div className="h-5 w-20 bg-white/10 rounded mb-2" />
          <div className="h-12 bg-white/10 rounded-lg" />
        </div>
        <div className="card animate-pulse">
          <div className="h-5 w-24 bg-white/10 rounded mb-2" />
          <div className="h-12 bg-white/10 rounded-lg" />
        </div>
        <div className="card animate-pulse">
          <div className="h-5 w-16 bg-white/10 rounded mb-2" />
          <div className="h-12 bg-white/10 rounded-lg" />
        </div>
        <div className="card animate-pulse">
          <div className="h-5 w-12 bg-white/10 rounded mb-2" />
          <div className="h-24 bg-white/10 rounded-lg" />
        </div>
        <div className="h-12 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}
