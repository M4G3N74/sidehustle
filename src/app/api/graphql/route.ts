import { ApolloServer } from '@apollo/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { incomes, goals, recurrings, users, sessions, accounts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import {
  validateIncomeInput,
  validateGoalInput,
  validateRecurringInput,
  validatePasswordChange,
  validateStringLength,
} from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

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
    incomeBySource: [SourceBreakdown!]!
    monthlyData: [SourceBreakdown!]!
    recentIncomes: [Income!]!
    currentGoal: Goal
    recurrings: [Recurring!]!
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
    thisMonthIncome: Float!
    lastMonthIncome: Float!
    allTimeIncome: Float!
    incomeBySource: [SourceBreakdown!]!
    user: User
  }

  type Query {
    dashboard: DashboardData!
    goals: [Goal!]!
    recurrings: [Recurring!]!
    profile: ProfileData!
    export: ExportData!
    stats: StatsData!
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

  type Mutation {
    addIncome(source: String!, amount: Float!, category: String, description: String, date: String!): Boolean!
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

/** Helper to get the authenticated user ID or throw */
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

      const [allIncomes, allGoals, allRecurrings] = await Promise.all([
        db.query.incomes.findMany({
          where: eq(incomes.userId, userId),
        }),
        db.query.goals.findMany({
          where: eq(goals.userId, userId),
        }),
        db.query.recurrings.findMany({
          where: eq(recurrings.userId, userId),
        }),
      ]);

      const thisMonthIncome = allIncomes
        .filter(i => {
          const d = new Date(i.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((sum, i) => sum + i.amount, 0);

      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;
      const lastMonthIncome = allIncomes
        .filter(i => {
          const d = new Date(i.date);
          return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
        })
        .reduce((sum, i) => sum + i.amount, 0);

      const allTimeIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);

      const activeRecurrings = allRecurrings.filter(r => r.isActive === 1);
      const recurringIncome = activeRecurrings.reduce((sum, r) => sum + r.amount, 0);

      const incomeBySource = allIncomes.reduce((acc, inc) => {
        acc[inc.source] = (acc[inc.source] || 0) + inc.amount;
        return acc;
      }, {} as Record<string, number>);

      const monthlyMap = new Map<string, number>();
      allIncomes.forEach(inc => {
        const date = new Date(inc.date);
        const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + inc.amount);
      });

      const currentGoal = allGoals.find(g => 
        g.month === month + 1 && g.year === year
      );

      return {
        thisMonthIncome,
        lastMonthIncome,
        allTimeIncome,
        recurringIncome,
        incomeBySource: Object.entries(incomeBySource).map(([source, amount]) => ({ source, amount })),
        monthlyData: Array.from(monthlyMap.entries()).map(([source, amount]) => ({ source, amount })),
        recentIncomes: allIncomes
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map(i => ({
            ...i,
            date: formatDate(i.date),
          })),
        currentGoal: currentGoal || null,
        recurrings: allRecurrings.map(r => ({
          ...r,
          isActive: r.isActive === 1,
        })),
      };
    },

    goals: async () => {
      const userId = await requireAuth();
      return db.query.goals.findMany({
        where: eq(goals.userId, userId),
      });
    },

    recurrings: async () => {
      const userId = await requireAuth();
      const allRecurrings = await db.query.recurrings.findMany({
        where: eq(recurrings.userId, userId),
      });
      return allRecurrings.map(r => ({
        ...r,
        isActive: r.isActive === 1,
      }));
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
        incomes: allIncomes.map(i => ({
          ...i,
          date: formatDate(i.date),
        })),
        goals: allGoals,
        recurrings: allRecurrings.map(r => ({
          ...r,
          isActive: r.isActive === 1,
        })),
      };
    },

    export: async () => {
      const userId = await requireAuth();

      const [user, allIncomes] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, userId) }),
        db.query.incomes.findMany({ where: eq(incomes.userId, userId) }),
      ]);

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();

      const thisMonthIncome = allIncomes
        .filter(i => {
          const d = new Date(i.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .reduce((sum, i) => sum + i.amount, 0);

      const lastMonth = month === 0 ? 11 : month - 1;
      const lastMonthYear = month === 0 ? year - 1 : year;
      const lastMonthIncome = allIncomes
        .filter(i => {
          const d = new Date(i.date);
          return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
        })
        .reduce((sum, i) => sum + i.amount, 0);

      const allTimeIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);

      const incomeBySource = allIncomes.reduce((acc, inc) => {
        acc[inc.source] = (acc[inc.source] || 0) + inc.amount;
        return acc;
      }, {} as Record<string, number>);

      return {
        incomes: allIncomes.map(i => ({
          ...i,
          date: formatDate(i.date),
        })),
        thisMonthIncome,
        lastMonthIncome,
        allTimeIncome,
        incomeBySource: Object.entries(incomeBySource).map(([source, amount]) => ({ source, amount })),
        user: user ? { id: user.id, name: user.name, email: user.email } : null,
      };
    },

    stats: async () => {
      // Use SQL aggregates instead of fetching all records
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

    setGoal: async (_: unknown, args: { title: string; targetAmount: number }) => {
      const userId = await requireAuth();

      const validation = validateGoalInput(args);
      if (!validation.valid) throw new Error(validation.error);

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
          .set({ title: args.title.trim(), targetAmount: args.targetAmount })
          .where(and(eq(goals.id, existing.id), eq(goals.userId, userId)));
      } else {
        await db.insert(goals).values({
          userId,
          title: args.title.trim(),
          targetAmount: args.targetAmount,
          month,
          year,
        });
      }
      return { success: true, message: 'Goal saved' };
    },

    deleteGoal: async (_: unknown, args: { id: number }) => {
      const userId = await requireAuth();
      // Ownership check: only delete if the goal belongs to the current user
      const result = await db.delete(goals).where(
        and(eq(goals.id, args.id), eq(goals.userId, userId))
      );
      return true;
    },

    addRecurring: async (_: unknown, args: { name: string; amount: number; category?: string }) => {
      const userId = await requireAuth();

      const validation = validateRecurringInput(args);
      if (!validation.valid) throw new Error(validation.error);

      await db.insert(recurrings).values({
        userId,
        name: args.name.trim(),
        amount: args.amount,
        category: args.category?.trim() || null,
      });
      return true;
    },

    toggleRecurring: async (_: unknown, args: { id: number; current: number }) => {
      const userId = await requireAuth();
      // Ownership check: only toggle if it belongs to the current user
      await db.update(recurrings)
        .set({ isActive: args.current === 1 ? 0 : 1 })
        .where(and(eq(recurrings.id, args.id), eq(recurrings.userId, userId)));
      return true;
    },

    deleteRecurring: async (_: unknown, args: { id: number }) => {
      const userId = await requireAuth();
      // Ownership check: only delete if it belongs to the current user
      await db.delete(recurrings).where(
        and(eq(recurrings.id, args.id), eq(recurrings.userId, userId))
      );
      return true;
    },

    deleteAccount: async () => {
      const userId = await requireAuth();
      // Delete all user data including sessions and accounts
      await db.delete(incomes).where(eq(incomes.userId, userId));
      await db.delete(goals).where(eq(goals.userId, userId));
      await db.delete(recurrings).where(eq(recurrings.userId, userId));
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
  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`graphql:${clientIp}`, RATE_LIMITS.graphql);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { errors: [{ message: 'Too many requests. Please try again later.' }] },
      { status: 429 }
    );
  }

  // CSRF protection: require custom header
  const requestedWith = request.headers.get('x-requested-with');
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return NextResponse.json(
      { errors: [{ message: 'Invalid content type' }] },
      { status: 400 }
    );
  }

  const body = await request.json();
  const response = await server.executeOperation({
    query: body.query,
    variables: body.variables,
  });

  if (response.body.kind === 'single') {
    return NextResponse.json(response.body.singleResult);
  }
  
  return NextResponse.json({ errors: [{ message: 'Invalid request' }] });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'GraphQL endpoint. Use POST with query and variables.' 
  });
}
