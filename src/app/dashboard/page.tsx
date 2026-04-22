'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardContent from './DashboardContent';
import { useDashboard } from '@/components/DashboardContext';

function DashboardInner() {
  const { data, loading, refresh } = useDashboard();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      refresh();
      const onFocus = () => refresh();
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
      </div>
    );
  }

  if (!session || !data) return null;

  return <DashboardContent data={data} />;
}

export default function DashboardPage() {
  return <DashboardInner />;
}
