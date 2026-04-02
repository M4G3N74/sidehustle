'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function toggleUserBan(targetUserId: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const currentRole = session.user.role;
  if (currentRole !== 'ADMIN' && currentRole !== 'MOD') {
    return { error: 'Strictly denied. Admin or Mod role required.' };
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  });

  if (!target) return { error: 'User not found.' };

  // Protective Rules
  if (target.id === parseInt(session.user.id)) return { error: 'You cannot ban yourself.' };
  if (target.role === 'ADMIN' && currentRole !== 'ADMIN') return { error: 'Moderators cannot ban Administrators.' };
  if (target.role === 'ADMIN' && currentRole === 'ADMIN') return { error: 'Administrators cannot be banned. Demote them first if needed.' };

  await db.update(users)
    .set({ isBanned: target.isBanned ? 0 : 1 })
    .where(eq(users.id, targetUserId));

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function resetUserPassword(targetUserId: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const currentRole = session.user.role;
  if (currentRole !== 'ADMIN' && currentRole !== 'MOD') {
    return { error: 'Strictly denied. Admin or Mod role required.' };
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  });

  if (!target) return { error: 'User not found.' };

  // Protective Rules
  if (target.role === 'ADMIN' && currentRole !== 'ADMIN') return { error: 'Moderators cannot reset Administrator passwords.' };
  
  const newPassword = generateRandomPassword(12);
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, targetUserId));

  return { success: true, temporaryPassword: newPassword };
}
