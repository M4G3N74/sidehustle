'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { graphqlRequest, QUERIES } from '@/lib/graphql';

export interface Income {
  id: number;
  source: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

export interface Spending {
  id: number;
  name: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
}

export interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  month: number;
  year: number;
}

export interface Recurring {
  id: number;
  name: string;
  amount: number;
  category: string | null;
  isActive: boolean;
}

export interface DashboardData {
  thisMonthIncome: number;
  lastMonthIncome: number;
  allTimeIncome: number;
  thisMonthSpending: number;
  lastMonthSpending: number;
  recurringIncome: number;
  incomeBySource: { source: string; amount: number }[];
  monthlyData: { source: string; amount: number }[];
  recentIncomes: Income[];
  recentSpendings: Spending[];
  currentGoal: Goal | null;
  recurrings: Recurring[];
  // Full lists (populated from SPENDING + PROFILE queries on demand)
  allIncomes: Income[];
  allSpendings: Spending[];
  goals: Goal[];
}

interface DashboardContextValue {
  data: DashboardData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  // Optimistic helpers
  optimisticDeleteIncome: (id: number) => void;
  optimisticDeleteSpending: (id: number) => void;
  optimisticUpdateIncome: (income: Income) => void;
  optimisticUpdateSpending: (spending: Spending) => void;
  optimisticAddIncome: (income: Income) => void;
  optimisticAddSpending: (spending: Spending) => void;
  optimisticToggleRecurring: (id: number) => void;
  optimisticDeleteRecurring: (id: number) => void;
  optimisticAddRecurring: (recurring: Recurring) => void;
  optimisticSetGoal: (goal: Goal) => void;
  optimisticDeleteGoal: (id: number) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

function computeTotals(data: DashboardData): DashboardData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastMonth = month === 0 ? 11 : month - 1;
  const lastMonthYear = month === 0 ? year - 1 : year;

  const thisMonthIncome = data.allIncomes
    .filter(i => { const d = new Date(i.date); return d.getFullYear() === year && d.getMonth() === month; })
    .reduce((s, i) => s + i.amount, 0);
  const lastMonthIncome = data.allIncomes
    .filter(i => { const d = new Date(i.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
    .reduce((s, i) => s + i.amount, 0);
  const allTimeIncome = data.allIncomes.reduce((s, i) => s + i.amount, 0);

  const thisMonthSpending = data.allSpendings
    .filter(s => { const d = new Date(s.date); return d.getFullYear() === year && d.getMonth() === month; })
    .reduce((s, i) => s + i.amount, 0);
  const lastMonthSpending = data.allSpendings
    .filter(s => { const d = new Date(s.date); return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth; })
    .reduce((s, i) => s + i.amount, 0);

  const activeRecurrings = data.recurrings.filter(r => r.isActive);
  const recurringIncome = activeRecurrings.reduce((s, r) => s + r.amount, 0);

  const sorted = [...data.allIncomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedSpendings = [...data.allSpendings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const incomeBySource = data.allIncomes.reduce((acc, i) => {
    acc[i.source] = (acc[i.source] || 0) + i.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyMap = new Map<string, number>();
  data.allIncomes.forEach(i => {
    const d = new Date(i.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + i.amount);
  });
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amount]) => {
      const [y, m] = key.split('-');
      return { source: new Date(parseInt(y), parseInt(m) - 1).toLocaleString('default', { month: 'short', year: '2-digit' }), amount };
    });

  const currentGoal = data.goals.find(g => g.month === month + 1 && g.year === year) || null;

  return {
    ...data,
    thisMonthIncome,
    lastMonthIncome,
    allTimeIncome,
    thisMonthSpending,
    lastMonthSpending,
    recurringIncome,
    recentIncomes: sorted.slice(0, 5),
    recentSpendings: sortedSpendings.slice(0, 5),
    incomeBySource: Object.entries(incomeBySource).map(([source, amount]) => ({ source, amount })),
    monthlyData,
    currentGoal,
  };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const [dashResult, profileResult, spendResult, goalsResult] = await Promise.all([
        graphqlRequest<{ dashboard: any }>(QUERIES.DASHBOARD),
        graphqlRequest<{ profile: { incomes: any[] } }>(QUERIES.PROFILE),
        graphqlRequest<{ spending: { recentSpendings: Spending[] } }>(QUERIES.SPENDING),
        graphqlRequest<{ goals: Goal[] }>(QUERIES.GOALS),
      ]);
      const d = dashResult.dashboard;
      const raw: DashboardData = {
        ...d,
        allIncomes: profileResult.profile.incomes,
        allSpendings: spendResult.spending.recentSpendings,
        goals: goalsResult.goals,
      };
      setData(computeTotals(raw));
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, []);

  // Optimistic helpers — mutate local state instantly, refresh in background
  const mutate = useCallback((updater: (d: DashboardData) => DashboardData) => {
    setData(prev => prev ? computeTotals(updater(prev)) : prev);
  }, []);

  const optimisticDeleteIncome = useCallback((id: number) => {
    mutate(d => ({ ...d, allIncomes: d.allIncomes.filter(i => i.id !== id) }));
    refresh();
  }, [mutate, refresh]);

  const optimisticDeleteSpending = useCallback((id: number) => {
    mutate(d => ({ ...d, allSpendings: d.allSpendings.filter(s => s.id !== id) }));
    refresh();
  }, [mutate, refresh]);

  const optimisticUpdateIncome = useCallback((income: Income) => {
    mutate(d => ({ ...d, allIncomes: d.allIncomes.map(i => i.id === income.id ? income : i) }));
    refresh();
  }, [mutate, refresh]);

  const optimisticUpdateSpending = useCallback((spending: Spending) => {
    mutate(d => ({ ...d, allSpendings: d.allSpendings.map(s => s.id === spending.id ? spending : s) }));
    refresh();
  }, [mutate, refresh]);

  const optimisticAddIncome = useCallback((income: Income) => {
    mutate(d => ({ ...d, allIncomes: [income, ...d.allIncomes] }));
    refresh();
  }, [mutate, refresh]);

  const optimisticAddSpending = useCallback((spending: Spending) => {
    mutate(d => ({ ...d, allSpendings: [spending, ...d.allSpendings] }));
    refresh();
  }, [mutate, refresh]);

  const optimisticToggleRecurring = useCallback((id: number) => {
    mutate(d => ({ ...d, recurrings: d.recurrings.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r) }));
    refresh();
  }, [mutate, refresh]);

  const optimisticDeleteRecurring = useCallback((id: number) => {
    mutate(d => ({ ...d, recurrings: d.recurrings.filter(r => r.id !== id) }));
    refresh();
  }, [mutate, refresh]);

  const optimisticAddRecurring = useCallback((recurring: Recurring) => {
    mutate(d => ({ ...d, recurrings: [...d.recurrings, recurring] }));
    refresh();
  }, [mutate, refresh]);

  const optimisticSetGoal = useCallback((goal: Goal) => {
    mutate(d => ({
      ...d,
      goals: d.goals.some(g => g.id === goal.id)
        ? d.goals.map(g => g.id === goal.id ? goal : g)
        : [...d.goals, goal],
    }));
    refresh();
  }, [mutate, refresh]);

  const optimisticDeleteGoal = useCallback((id: number) => {
    mutate(d => ({ ...d, goals: d.goals.filter(g => g.id !== id) }));
    refresh();
  }, [mutate, refresh]);

  return (
    <DashboardContext.Provider value={{
      data, loading, refresh,
      optimisticDeleteIncome, optimisticDeleteSpending,
      optimisticUpdateIncome, optimisticUpdateSpending,
      optimisticAddIncome, optimisticAddSpending,
      optimisticToggleRecurring, optimisticDeleteRecurring, optimisticAddRecurring,
      optimisticSetGoal, optimisticDeleteGoal,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
