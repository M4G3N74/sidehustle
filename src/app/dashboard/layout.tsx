'use client';

import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, PlusCircle, Target, LogOut, FileDown, LayoutDashboard, Menu, X, User } from 'lucide-react';
import { useState } from 'react';

import { Users } from 'lucide-react';

const getNavItems = (role: string) => {
  const items = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/dashboard/add', icon: PlusCircle, label: 'Add' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' }
  ];
  
  if (role === 'ADMIN' || role === 'MOD') {
    items.push({ href: '/dashboard/users', icon: Users, label: 'Users' });
  }
  
  items.push({ href: '/dashboard/profile', icon: User, label: 'Profile' });
  return items;
};

const getSidebarItems = (role: string) => {
  const items = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/add', icon: PlusCircle, label: 'Add Income' },
    { href: '/dashboard/goals', icon: Target, label: 'Goals' },
    { href: '/dashboard/export', icon: FileDown, label: 'Export PDF' }
  ];
  
  if (role === 'ADMIN' || role === 'MOD') {
    items.push({ href: '/dashboard/users', icon: Users, label: 'Manage Users' });
  }
  
  items.push({ href: '/dashboard/profile', icon: User, label: 'Profile' });
  return items;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userName = session?.user?.name || session?.user?.email || 'User';
  const role = session?.user?.role || 'USER';

  const navItems = getNavItems(role);
  const sidebarItems = getSidebarItems(role);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f0c29]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2" aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain w-full h-full" />
          </div>
          <span className="font-bold text-lg">streethustler</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/export" className="p-2" aria-label="Export data">
            <FileDown className="w-5 h-5" />
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2" aria-label="Sign out">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-[#0f0c29] border-r border-white/10 z-50 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1">
              <Image src="/logo.png" alt="Logo" width={56} height={56} className="object-contain w-full h-full" />
            </div>
            <span className="font-bold text-xl">streethustler</span>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-purple-600 text-white' : 'text-white/60 hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="text-sm text-white/60 mb-2">Signed in as</div>
          <div className="text-sm font-medium truncate mb-3">{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-white/60"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-[#0f0c29]/95 backdrop-blur-md border-r border-white/10 z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1">
              <Image src="/logo.png" alt="Logo" width={56} height={56} className="object-contain w-full h-full" />
            </div>
            <span className="font-bold text-xl gradient-text">streethustler</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' : 'text-white/60 hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-sm text-white/60 mb-1">Signed in as</div>
          <div className="text-sm font-medium truncate mb-3">{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/10 text-white/60"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 pt-20 lg:pt-8 pb-24 lg:pb-8 min-h-screen page-fade-in">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f0c29]/95 backdrop-blur-md border-t border-white/10 flex justify-around py-3 z-40">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                isActive ? 'text-purple-400' : 'text-white/50'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
