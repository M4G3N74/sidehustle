import LandingContent from './LandingContent';
import { db } from '@/db';
import { incomes, users } from '@/db/schema';
import { sql } from 'drizzle-orm';

export default async function Home() {
  let stats = { totalUsers: 0, totalIncome: 0, totalIncomes: 0 };
  
  try {
    // Use SQL aggregates instead of fetching all records
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [incomeStats] = await db.select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(amount), 0)`,
    }).from(incomes);

    stats = {
      totalUsers: Number(userCount.count),
      totalIncome: Number(incomeStats.total),
      totalIncomes: Number(incomeStats.count),
    };
  } catch (e) {
    console.error('Failed to fetch stats:', e);
  }
  
  return <LandingContent initialStats={stats} />;
}