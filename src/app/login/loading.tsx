export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/10 animate-pulse" />
        <div className="h-8 w-40 mx-auto bg-white/10 rounded mb-2" />
        <div className="h-4 w-48 mx-auto bg-white/10 rounded mb-8" />
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-white/10 rounded" />
            <div className="h-12 bg-white/10 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-12 bg-white/10 rounded-lg" />
          </div>
          <div className="h-12 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
