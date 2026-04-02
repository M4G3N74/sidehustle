'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { incomes, goals, recurrings } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import {
  validateIncomeInput,
  validateGoalInput,
  validateRecurringInput,
} from '@/lib/validation';

export async function addIncome(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const userId = parseInt(session.user.id);
  const source = (formData.get('source') as string)?.trim();
  const amount = parseFloat(formData.get('amount') as string);
  const category = (formData.get('category') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const date = formData.get('date') as string;

  const validation = validateIncomeInput({ source, amount, date, category, description });
  if (!validation.valid) return { error: validation.error };

  await db.insert(incomes).values({
    userId,
    source,
    amount,
    category: category || null,
    description: description || null,
    date: new Date(date),
  });

  revalidatePath('/dashboard');
  return { success: true };
}

export async function setGoal(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const userId = parseInt(session.user.id);
  const title = (formData.get('title') as string)?.trim();
  const targetAmount = parseFloat(formData.get('targetAmount') as string);

  const validation = validateGoalInput({ title, targetAmount });
  if (!validation.valid) return { error: validation.error };

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const existing = await db.query.goals.findFirst({
    where: (goals, { and, eq }) => and(
      eq(goals.userId, userId),
      eq(goals.month, month),
      eq(goals.year, year)
    ),
  });

  if (existing) {
    await db.update(goals)
      .set({ title, targetAmount })
      .where(and(eq(goals.id, existing.id), eq(goals.userId, userId)));
  } else {
    await db.insert(goals).values({
      userId,
      title,
      targetAmount,
      month,
      year,
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/goals');
  return { success: true };
}

export async function deleteGoal(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const userId = parseInt(session.user.id);

  // Ownership check: only delete if the goal belongs to the current user
  await db.delete(goals).where(
    and(eq(goals.id, id), eq(goals.userId, userId))
  );

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/goals');
  return { success: true };
}

export async function addRecurring(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const userId = parseInt(session.user.id);
  const name = (formData.get('name') as string)?.trim();
  const amount = parseFloat(formData.get('amount') as string);
  const category = (formData.get('category') as string)?.trim();

  const validation = validateRecurringInput({ name, amount, category });
  if (!validation.valid) return { error: validation.error };

  await db.insert(recurrings).values({
    userId,
    name,
    amount,
    category: category || null,
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/goals');
  revalidatePath('/dashboard/recurring');
  return { success: true };
}

export async function toggleRecurring(id: number, current: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const userId = parseInt(session.user.id);

  // Ownership check
  await db.update(recurrings)
    .set({ isActive: current === 1 ? 0 : 1 })
    .where(and(eq(recurrings.id, id), eq(recurrings.userId, userId)));

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/goals');
  revalidatePath('/dashboard/recurring');
  return { success: true };
}

export async function deleteRecurring(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const userId = parseInt(session.user.id);

  // Ownership check
  await db.delete(recurrings).where(
    and(eq(recurrings.id, id), eq(recurrings.userId, userId))
  );

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/goals');
  revalidatePath('/dashboard/recurring');
  return { success: true };
}
