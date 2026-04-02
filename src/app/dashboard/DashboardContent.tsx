'use client';

import { format } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Target, Wallet, Clock, Repeat } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

interface Income {
  id: number;
  source: string;
  amount: number;
  category: string | null;
  description: string | null;
  date: Date;
}

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
}

interface Recurring {
  id: number;
  name: string;
  amount: number;
  isActive: number | null;
}

interface DashboardData {
  thisMonthIncome: number;
  lastMonthIncome: number;
  allTimeIncome: number;
  recentIncomes: Income[];
  currentGoal: Goal | null | undefined;
  incomeBySource: { source: string; amount: number }[];
  monthlyData: { source: string; amount: number }[];
  recurringIncome: number;
  recurrings: Recurring[];
}

const COLORS = ['#7c3aed', '#a78bfa', '#6366f1', '#8b5cf6', '#c084fc', '#ddd6fe'];

export default function DashboardContent({ data }: { data: DashboardData }) {
  const percentChange = data.lastMonthIncome > 0
    ? ((data.thisMonthIncome - data.lastMonthIncome) / data.lastMonthIncome) * 100
    : 0;

  const goalProgress = data.currentGoal
    ? (data.thisMonthIncome / data.currentGoal.targetAmount) * 100
    : 0;

  const pieData = data.incomeBySource?.map((item) => ({ name: item.source, value: item.amount })) || [];
  const barData = data.monthlyData?.map((item) => ({ month: item.source, amount: item.amount })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-white/60 text-sm">This Month</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-tabular">K {data.thisMonthIncome.toLocaleString()}</p>
          {percentChange !== 0 && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {percentChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(percentChange).toFixed(1)}%</span>
              <span className="text-white/40 text-xs">vs last month</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-white/60 text-sm">All Time</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-tabular">K {data.allTimeIncome.toLocaleString()}</p>
          <p className="text-white/40 text-sm mt-2">Total earned</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-pink-500/20">
              <Clock className="w-4 h-4 text-pink-400" />
            </div>
            <span className="text-white/60 text-sm">Last Month</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-tabular">K {data.lastMonthIncome.toLocaleString()}</p>
          <p className="text-white/40 text-sm mt-2">Previous month</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-white/60 text-sm">Avg/Month</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-tabular">
            K{data.monthlyData.length > 0 
              ? Math.round(data.allTimeIncome / data.monthlyData.length).toLocaleString() 
              : '0'}
          </p>
          <p className="text-white/40 text-sm mt-2">Monthly average</p>
        </div>
      </div>

      {data.recurringIncome > 0 && data.recurrings && data.recurrings.some(r => r.isActive === 1) && (
        <div className="card bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Repeat className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Recurring Income</p>
                <p className="text-2xl font-bold text-green-400 font-tabular">K {data.recurringIncome.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/dashboard/goals" className="text-sm text-green-400 hover:underline">
              Manage
            </Link>
          </div>
        </div>
      )}

      {data.currentGoal && (
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-lg">{data.currentGoal.title}</p>
                <p className="text-white/50 text-sm">Monthly Goal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-tabular">K {data.thisMonthIncome.toLocaleString()}</p>
              <p className="text-white/50 text-sm">of K {data.currentGoal.targetAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="progress-bar h-3">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(goalProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-white/50 text-sm">{goalProgress.toFixed(0)}% complete</p>
            <p className="text-white/50 text-sm">K {(data.currentGoal.targetAmount - data.thisMonthIncome).toLocaleString()} remaining</p>
          </div>
          {goalProgress >= 100 && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 text-center">
              <span className="text-xl">🎉</span>
              <p className="font-semibold text-green-300 mt-1">Goal achieved! Great work!</p>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-charts">
        {pieData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Income by Source
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `K ${Number(value).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm">{entry.name}</span>
                  <span className="text-sm font-medium">K {entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {barData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Monthly Trend
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={barData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.5)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.5)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `K ${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `K ${Number(value).toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            Recent Activity
          </h3>
          <Link href="/dashboard/add" className="text-sm text-purple-400 hover:text-purple-300">
            + Add Income
          </Link>
        </div>
        <div className="space-y-2">
          {data.recentIncomes.slice(0, 8).map((income) => (
            <div key={income.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">{income.source}</p>
                  <p className="text-sm text-white/50">
                    {income.description || income.category || 'No description'} • {format(new Date(income.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <span className="text-green-400 font-semibold text-lg font-tabular">+K {income.amount.toLocaleString()}</span>
            </div>
          ))}
          {data.recentIncomes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/40 mb-4">No recent activity</p>
              <Link href="/dashboard/add" className="btn-primary inline-block">
                Add Your First Income
              </Link>
            </div>
          )}
        </div>
      </div>

      <Link href="/dashboard/add" className="floating-btn lg:hidden">
        <DollarSign className="w-6 h-6" />
      </Link>
    </div>
  );
}
