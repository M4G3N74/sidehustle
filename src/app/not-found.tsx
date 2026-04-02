import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />

      <div className="card w-full max-w-4xl p-8 text-center relative">
        <div className="relative w-full max-w-lg aspect-square mx-auto mb-6">
          <Image 
            src="/404.jpg" 
            alt="404" 
            fill 
            className="object-contain"
          />
        </div>
        {/* <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-white/60 mb-8 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back on track.
        </p> */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back Home
          </Link>
          <Link
            href="/dashboard"
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
