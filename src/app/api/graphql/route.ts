import { ApolloServer } from '@apollo/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { incomes, goals, recurrings, spendings, users, sessions, accounts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import {
  validateIncomeInput,
  validateGoalInput,
  validateRecurringInput,
  validateSpendingInput,
  validatePasswordChange,
  validateStringLength,
} from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';
import { resolvePersistedQuery } from '@/lib/persisted-queries';
import { encryptResponse } from '@/lib/crypto';

const typeDefs = `#graphql
  type User {
    id: Int!
    name: String
    email: String!
  }

  type Income {
    id: Int!
    source: String!
    amount: Float!
    category: String
    description: String
    date: String!
  }

  type Spending {
    id: Int!
    name: String!
    amount: Float!
    category: String
    description: String
    date: String!
  }

  type Goal {
    id: Int!
    title: String!
    targetAmount: Float!
    month: Int!
    year: Int!
  }

  type Recurring {
    id: Int!
    name: String!
    amount: Float!
    category: String
    isActive: Boolean!
  }

  type SourceBreakdown {
    source: String!
    amount: Float!
  }

  type DashboardData {
    thisMonthIncome: Float!
    lastMonthIncome: Float!
    allTimeIncome: Float!
    recurringIncome: Float!
    thisMonthSpending: Float!
    lastMonthSpending: Float!
    incomeBySource: [SourceBreakdown!]!
    monthlyData: [SourceBreakdown!]!
    recentIncomes: [Income!]!
    recentSpendings: [Spending!]!
    currentGoal: Goal
    recurrings: [Recurring!]!
  }

  type SpendingData {
    thisMonthSpending: Float!
    lastMonthSpending: Float!
    allTimeSpending: Float!
    recentSpendings: [Spending!]!
    spendingByCategory: [SourceBreakdown!]!
  }

  type ProfileData {
    user: User
    totalIncome: Float!
    totalRecurring: Float!
    incomes: [Income!]!
    goals: [Goal!]!
    recurrings: [Recurring!]!
  }

  type ExportData {
    incomes: [Income!]!
    spendings: [Spending!]!
    thisMonthIncome: Float!
    lastMonthIncome: Float!
    allTimeIncome: Float!
    thisMonthSpending: Float!
    lastMonthSpending: Float!
    allTimeSpending: Float!
    incomeBySource: [SourceBreakdown!]!
    user: User
  }

  type StatsData {
    totalUsers: Int!
    totalIncome: Float!
    totalIncomes: Int!
  }

  type MutationResult {
    success: Boolean!
    message: String
  }

  type Query {
    dashboard: DashboardData!
    spending: SpendingData!
    goals: [Goal!]!
    recurrings: [Recurring!]!
    profile: ProfileData!
    export: ExportData!
    stats: StatsData!
  }

  type Mutation {
    addIncome(source: String!, amount: Float!, category: String, description: String, date: String!): Boolean!
    updateIncome(id: Int!, source: String!, amount: Float!, category: String, description: String, date: String!): Boolean!
    deleteIncome(id: Int!): Boolean!
    addSpending(name: String!, amount: Float!, category: String, description: String, date: String!): Boolean!
    updateSpending(id: Int!, name: String!, amount: Float!, category: String, description: String, date: String!): Boolean!
    deleteSpending(id: Int!): Boolean!
    setGoal(title: String!, targetAmount: Float!): MutationResult!
    deleteGoal(id: Int!): Boolean!
    addRecurring(name: String!, amount: Float!, category: String): Boolean!
    toggleRecurring(id: Int!, current: Int!): Boolean!
    deleteRecurring(id: Int!): Boolean!
    deleteAccount: Boolean!
    updateProfile(name: String!): Boolean!
    updatePassword(currentPassword: String!, newPassword: String!): Boolean!
  }
`;

const formatDate = (date: Date | string | null) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

async function requireAuth(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Unauthorized');
  return parseInt(session.user.id);
}

const resolvers = {
  Query: {
    dashboard: async () => {
      const userId = await requireAuth();
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const [allIncomes, allGoals, allRecurrings, allSpendings] = await Promise.all([
        db.query.incomes.findMany({ where: eq(incomes.userId, userId) }),
        db.query.goals.findMany({ where: eq(goals.userId, userId) }),
        db.query.recurrings.findMany({ where: eq(recurrings.userId, userId) }),
        db.query.spendings.findMany({ where: eq(spendings.userId, userId) }),
      ]);

      const thisMonthIncome = allIncomes
        .filter(i => { const d = new Date(i.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((sum, i) => sum + i.amount, 0);

      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;
      const lastMonthIncome = allIncomes
        .filter(i => { const d = new Date(i.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
        .reduce((sum, i) => sum + i.amount, 0);

      const allTimeIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);
      const activeRecurrings = allRecurrings.filter(r => r.isActive === 1);
      const recurringIncome = activeRecurrings.reduce((sum, r) => sum + r.amount, 0);

      const thisMonthSpending = allSpendings
        .filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((sum, s) => sum + s.amount, 0);

      const incomeBySource = allIncomes.reduce((acc, inc) => {
        acc[inc.source] = (acc[inc.source] || 0) + inc.amount;
        return acc;
      }, {} as Record<string, number>);

      const monthlyMap = new Map<string, number>();
      allIncomes.forEach(inc => {
        const date = new Date(inc.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + inc.amount);
      });

      const sortedMonthlyData = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, amount]) => {
          const [year, month] = key.split('-');
          const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
          return { source: label, amount };
        });

      const currentGoal = allGoals.find(g => g.month === month + 1 && g.year === year);

      return {
        thisMonthIncome,
        lastMonthIncome,
        allTimeIncome,
        recurringIncome,
        thisMonthSpending,
        lastMonthSpending: allSpendings
          .filter(s => { const d = new Date(s.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
          .reduce((sum, s) => sum + s.amount, 0),
        incomeBySource: Object.entries(incomeBySource).map(([source, amount]) => ({ source, amount })),
        monthlyData: sortedMonthlyData,
        recentIncomes: allIncomes
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map(i => ({ ...i, date: formatDate(i.date) })),
        recentSpendings: allSpendings
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map(s => ({ ...s, date: formatDate(s.date) })),
        currentGoal: currentGoal || null,
        recurrings: allRecurrings.map(r => ({ ...r, isActive: r.isActive === 1 })),
      };
    },

    spending: async () => {
      const userId = await requireAuth();
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const allSpendings = await db.query.spendings.findMany({ where: eq(spendings.userId, userId) });

      const thisMonthSpending = allSpendings
        .filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((sum, s) => sum + s.amount, 0);

      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;
      const lastMonthSpending = allSpendings
        .filter(s => { const d = new Date(s.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
        .reduce((sum, s) => sum + s.amount, 0);

      const allTimeSpending = allSpendings.reduce((sum, s) => sum + s.amount, 0);

      const spendingByCategory = allSpendings.reduce((acc, s) => {
        const key = s.category || 'Uncategorized';
        acc[key] = (acc[key] || 0) + s.amount;
        return acc;
      }, {} as Record<string, number>);

      return {
        thisMonthSpending,
        lastMonthSpending,
        allTimeSpending,
        recentSpendings: allSpendings
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(s => ({ ...s, date: formatDate(s.date) })),
        spendingByCategory: Object.entries(spendingByCategory).map(([source, amount]) => ({ source, amount })),
      };
    },

    goals: async () => {
      const userId = await requireAuth();
      return db.query.goals.findMany({ where: eq(goals.userId, userId) });
    },

    recurrings: async () => {
      const userId = await requireAuth();
      const allRecurrings = await db.query.recurrings.findMany({ where: eq(recurrings.userId, userId) });
      return allRecurrings.map(r => ({ ...r, isActive: r.isActive === 1 }));
    },

    profile: async () => {
      const userId = await requireAuth();

      const [user, allIncomes, allGoals, allRecurrings] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, userId) }),
        db.query.incomes.findMany({ where: eq(incomes.userId, userId) }),
        db.query.goals.findMany({ where: eq(goals.userId, userId) }),
        db.query.recurrings.findMany({ where: eq(recurrings.userId, userId) }),
      ]);

      const totalIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);
      const activeRecurrings = allRecurrings.filter(r => r.isActive === 1);
      const totalRecurring = activeRecurrings.reduce((sum, r) => sum + r.amount, 0);

      return {
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
        totalIncome,
        totalRecurring,
        incomes: allIncomes.map(i => ({ ...i, date: formatDate(i.date) })),
        goals: allGoals,
        recurrings: allRecurrings.map(r => ({ ...r, isActive: r.isActive === 1 })),
      };
    },

    export: async () => {
      const userId = await requireAuth();

      const [user, allIncomes, allSpendings] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, userId) }),
        db.query.incomes.findMany({ where: eq(incomes.userId, userId) }),
        db.query.spendings.findMany({ where: eq(spendings.userId, userId) }),
      ]);

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;

      const thisMonthIncome = allIncomes
        .filter(i => { const d = new Date(i.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((sum, i) => sum + i.amount, 0);
      const lastMonthIncome = allIncomes
        .filter(i => { const d = new Date(i.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
        .reduce((sum, i) => sum + i.amount, 0);
      const allTimeIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);

      const thisMonthSpending = allSpendings
        .filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; })
        .reduce((sum, s) => sum + s.amount, 0);
      const lastMonthSpending = allSpendings
        .filter(s => { const d = new Date(s.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
        .reduce((sum, s) => sum + s.amount, 0);
      const allTimeSpending = allSpendings.reduce((sum, s) => sum + s.amount, 0);

      const incomeBySource = allIncomes.reduce((acc, inc) => {
        acc[inc.source] = (acc[inc.source] || 0) + inc.amount;
        return acc;
      }, {} as Record<string, number>);

      return {
        incomes: allIncomes.map(i => ({ ...i, date: formatDate(i.date) })),
        spendings: allSpendings.map(s => ({ ...s, date: formatDate(s.date) })),
        thisMonthIncome,
        lastMonthIncome,
        allTimeIncome,
        thisMonthSpending,
        lastMonthSpending,
        allTimeSpending,
        incomeBySource: Object.entries(incomeBySource).map(([source, amount]) => ({ source, amount })),
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
      };
    },

    stats: async () => {
      const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [incomeStats] = await db.select({
        count: sql<number>`count(*)`,
        total: sql<number>`coalesce(sum(amount), 0)`,
      }).from(incomes);

      return {
        totalUsers: Number(userCount.count),
        totalIncome: Number(incomeStats.total),
        totalIncomes: Number(incomeStats.count),
      };
    },
  },

  Mutation: {
    addIncome: async (_: unknown, args: { source: string; amount: number; category?: string; description?: string; date: string }) => {
      const userId = await requireAuth();
      const validation = validateIncomeInput(args);
      if (!validation.valid) throw new Error(validation.error);
      await db.insert(incomes).values({
        userId,
        source: args.source.trim(),
        amount: args.amount,
        category: args.category?.trim() || null,
        description: args.description?.trim() || null,
        date: new Date(args.date),
      });
      return true;
    },

    updateIncome: async (_: unknown, args: { id: number; source: string; amount: number; category?: string; description?: string; date: string }) => {
      const userId = await requireAuth();
      const validation = validateIncomeInput({ source: args.source, amount: args.amount, date: args.date, category: args.category, description: args.description });
      if (!validation.valid) throw new Error(validation.error);
      await db.update(incomes)
        .set({ source: args.source.trim(), amount: args.amount, category: args.category?.trim() || null, description: args.description?.trim() || null, date: new Date(args.date) })
        .where(and(eq(incomes.id, args.id), eq(incomes.userId, userId)));
      return true;
    },

    deleteIncome: async (_: unknown, args: { id: number }) => {
      const userId = await requireAuth();
      await db.delete(incomes).where(and(eq(incomes.id, args.id), eq(incomes.userId, userId)));
      return true;
    },

    addSpending: async (_: unknown, args: { name: string; amount: number; category?: string; description?: string; date: string }) => {
      const userId = await requireAuth();
      const validation = validateSpendingInput(args);
      if (!validation.valid) throw new Error(validation.error);
      await db.insert(spendings).values({
        userId,
        name: args.name.trim(),
        amount: args.amount,
        category: args.category?.trim() || null,
        description: args.description?.trim() || null,
        date: new Date(args.date),
      });
      return true;
    },

    updateSpending: async (_: unknown, args: { id: number; name: string; amount: number; category?: string; description?: string; date: string }) => {
      const userId = await requireAuth();
      const validation = validateSpendingInput({ name: args.name, amount: args.amount, date: args.date, category: args.category, description: args.description });
      if (!validation.valid) throw new Error(validation.error);
      await db.update(spendings)
        .set({ name: args.name.trim(), amount: args.amount, category: args.category?.trim() || null, description: args.description?.trim() || null, date: new Date(args.date) })
        .where(and(eq(spendings.id, args.id), eq(spendings.userId, userId)));
      return true;
    },

    deleteSpending: async (_: unknown, args: { id: number }) => {
      const userId = await requireAuth();
      await db.delete(spendings).where(and(eq(spendings.id, args.id), eq(spendings.userId, userId)));
      return true;
    },

    setGoal: async (_: unknown, args: { title: string; targetAmount: number }) => {
      const userId = await requireAuth();
      const validation = validateGoalInput(args);
      if (!validation.valid) throw new Error(validation.error);

      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      const existing = await db.query.goals.findFirst({
        where: (goals, { and, eq }) => and(eq(goals.userId, userId), eq(goals.month, month), eq(goals.year, year)),
      });

      if (existing) {
        await db.update(goals).set({ title: args.title.trim(), targetAmount: args.targetAmount }).where(and(eq(goals.id, existing.id), eq(goals.userId, userId)));
      } else {
        await db.insert(goals).values({ userId, title: args.title.trim(), targetAmount: args.targetAmount, month, year });
      }
      return { success: true, message: 'Goal saved' };
    },

    deleteGoal: async (_: unknown, args: { id: number }) => {
      const userId = await requireAuth();
      await db.delete(goals).where(and(eq(goals.id, args.id), eq(goals.userId, userId)));
      return true;
    },

    addRecurring: async (_: unknown, args: { name: string; amount: number; category?: string }) => {
      const userId = await requireAuth();
      const validation = validateRecurringInput(args);
      if (!validation.valid) throw new Error(validation.error);
      await db.insert(recurrings).values({ userId, name: args.name.trim(), amount: args.amount, category: args.category?.trim() || null });
      return true;
    },

    toggleRecurring: async (_: unknown, args: { id: number; current: number }) => {
      const userId = await requireAuth();
      await db.update(recurrings).set({ isActive: args.current === 1 ? 0 : 1 }).where(and(eq(recurrings.id, args.id), eq(recurrings.userId, userId)));
      return true;
    },

    deleteRecurring: async (_: unknown, args: { id: number }) => {
      const userId = await requireAuth();
      await db.delete(recurrings).where(and(eq(recurrings.id, args.id), eq(recurrings.userId, userId)));
      return true;
    },

    deleteAccount: async () => {
      const userId = await requireAuth();
      await db.delete(incomes).where(eq(incomes.userId, userId));
      await db.delete(goals).where(eq(goals.userId, userId));
      await db.delete(recurrings).where(eq(recurrings.userId, userId));
      await db.delete(spendings).where(eq(spendings.userId, userId));
      await db.delete(sessions).where(eq(sessions.userId, userId));
      await db.delete(accounts).where(eq(accounts.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
      return true;
    },

    updateProfile: async (_: unknown, args: { name: string }) => {
      const userId = await requireAuth();
      const validation = validateStringLength(args.name, 'Name', 1, 100);
      if (!validation.valid) throw new Error(validation.error);
      await db.update(users).set({ name: args.name.trim() }).where(eq(users.id, userId));
      return true;
    },

    updatePassword: async (_: unknown, args: { currentPassword: string; newPassword: string }) => {
      const userId = await requireAuth();
      const validation = validatePasswordChange(args);
      if (!validation.valid) throw new Error(validation.error);

      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user || !user.password) throw new Error('User not found');

      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(args.currentPassword, user.password);
      if (!isValid) throw new Error('Current password is incorrect');

      const hashedPassword = await bcrypt.hash(args.newPassword, 12);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
      return true;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
});

await server.start();

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`graphql:${clientIp}`, RATE_LIMITS.graphql);
  if (!rateLimit.allowed) {
    return NextResponse.json({ errors: [{ message: 'Too many requests. Please try again later.' }] }, { status: 429 });
  }

  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return NextResponse.json({ errors: [{ message: 'Invalid content type' }] }, { status: 400 });
  }

  const body = await request.json();
  
  // Support both operationId (persisted) and raw query (dev only)
  let query: string;
  if (body.operationId) {
    const resolved = resolvePersistedQuery(body.operationId);
    if (!resolved) {
      return NextResponse.json({ errors: [{ message: 'Unknown operation' }] }, { status: 400 });
    }
    query = resolved;
  } else if (body.query && process.env.NODE_ENV !== 'production') {
    // Allow raw queries in dev for introspection/debugging
    query = body.query;
  } else {
    return NextResponse.json({ errors: [{ message: 'Invalid request' }] }, { status: 400 });
  }

  const response = await server.executeOperation({ query, variables: body.variables });

  if (response.body.kind === 'single') {
    const encrypted = await encryptResponse(response.body.singleResult);
    return NextResponse.json({ d: encrypted });
  }

  return NextResponse.json({ errors: [{ message: 'Invalid request' }] });
}

export async function GET() {
  return NextResponse.json({ message: 'GraphQL endpoint. Use POST with query and variables.' });
}
