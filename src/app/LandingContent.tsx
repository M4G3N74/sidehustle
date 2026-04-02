'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Target, BarChart3, Shield, Zap, ChevronRight } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalIncome: number;
  totalIncomes: number;
}

interface LandingContentProps {
  initialStats: Stats;
}

export default function LandingContent({ initialStats }: LandingContentProps) {
  const features = [
    { icon: TrendingUp, title: 'Track Income', desc: 'Monitor all your income streams in one place' },
    { icon: Target, title: 'Set Goals', desc: 'Define financial targets and track your progress' },
    { icon: BarChart3, title: 'Analytics', desc: 'Visualize your earnings with beautiful charts' },
    { icon: Shield, title: 'Secure', desc: 'Your data is protected with industry-standard security' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0f0c29]" />
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0f0c29]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center p-1.5">
              <Image src="/logo.png" alt="Logo" width={56} height={56} className="object-contain w-full h-full" />
            </div>
            <span className="text-xl font-bold gradient-text">streethustler</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/70 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white/70">Track your hustle, grow your wealth</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Master Your <span className="gradient-text">Income</span>
          </h1>
          
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Track every coin that flows into your pockets from your side hustles, gigs, and main income. 
            Set goals, monitor progress, and watch your wealth grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-white hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all flex items-center gap-2">
              Start Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-white hover:bg-white/10 transition-all">
              Log In
            </Link>
          </div>

          {/* Stats - Using initial data from server */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <div className="text-3xl font-bold gradient-text">
                K{initialStats.totalIncome >= 1000000 
                  ? `${(initialStats.totalIncome / 1000000).toFixed(1)}000,000` 
                  : initialStats.totalIncome >= 1000 
                    ? `${Math.round(initialStats.totalIncome / 1000)},000` 
                    : initialStats.totalIncome}
              </div>
              <div className="text-white/40 text-sm">Total Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text">{initialStats.totalIncomes}</div>
              <div className="text-white/40 text-sm">Income Entries</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-text">{initialStats.totalUsers}</div>
              <div className="text-white/40 text-sm">Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-white/60 text-center mb-16 max-w-xl mx-auto">
            Powerful features to help you manage your income like a pro
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
            <div className="relative text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">
                Join thousands of hustlers tracking their income and hitting their financial goals.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0f0c29] rounded-xl font-semibold hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center text-white/40 text-sm">
          <p>&copy; {new Date().getFullYear()} Purple Unlocker | Built for Street hustlers, by street hustlers.</p>
        </div>
      </footer>
    </div>
  );
}