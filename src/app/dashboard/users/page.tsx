import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { redirect } from 'next/navigation';
import UserManagementClient from './UserManagementClient';

export const metadata = {
  title: 'Manage Users - streethustler',
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  // Extra safety net despite middleware
  const role = session?.user?.role;
  if (!role || (role !== 'ADMIN' && role !== 'MOD')) {
    redirect('/dashboard');
  }

  // Fetch all registered users except their passwords
  const allUsers = await db.query.users.findMany({
    orderBy: (users, { desc }) => [desc(users.createdAt)],
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      createdAt: true,
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          User Management
        </h1>
        <p className="text-white/60 mt-2">
          Oversee platform participants. Ensure accounts follow guidelines and assist users with lost access.
        </p>
      </div>

      <div className="glass-card p-6 border border-white/10 overflow-hidden">
        <UserManagementClient users={allUsers} currentUserId={parseInt(session.user.id)} currentUserRole={role} />
      </div>
    </div>
  );
}
