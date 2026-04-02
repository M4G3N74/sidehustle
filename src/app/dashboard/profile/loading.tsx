export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="card animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-white/10" />
          <div>
            <div className="h-6 w-32 bg-white/10 rounded mb-2" />
            <div className="h-4 w-48 bg-white/10 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl">
              <div className="w-5 h-5 bg-white/10 rounded mb-2" />
              <div className="h-4 w-20 bg-white/10 rounded mb-1" />
              <div className="h-6 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
